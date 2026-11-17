process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-test-jwt-secret-test-jwt-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.EXPOSE_RESET_TOKEN = "true";

import { afterEach, beforeAll, afterAll, describe, expect, it } from "vitest";
import type { Express } from "express";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { Mongoose } from "mongoose";

let mongo: MongoMemoryServer;
let app: Express;
let mongoose: Mongoose;
let borrowerToken: string;
let lenderToken: string;
let borrowerId: string;
let lenderId: string;
let itemId: string;

type UserRecord = { token: string; user: { id: string } };

async function registerUser(
  email: string,
  location?: { latitude: number; longitude: number },
): Promise<UserRecord> {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Test User",
      email,
      password: "Password123",
      location: location
        ? {
            address: "Test address",
            locality: "Kothrud",
            city: "Pune",
            ...location,
          }
        : undefined,
    });
  expect(response.status).toBe(201);
  return response.body.data as UserRecord;
}

async function createItem(token: string) {
  const response = await request(app)
    .post("/api/items")
    .set("Authorization", `Bearer ${token}`)
    .send({
      itemName: "HD Portable Projector",
      category: "Projectors & Event Gear",
      description:
        "A portable projector suitable for presentations, tutorials, and small events on or near campus.",
      images: ["https://example.com/projector.jpg"],
      condition: "like-new",
      totalQuantity: 2,
      location: {
        address: "MIT-ADT Campus, Loni Kalbhor",
        locality: "Loni Kalbhor",
        city: "Pune",
        latitude: 18.489,
        longitude: 73.833,
      },
      rentalPrice: 180,
      borrowingTerms: "Return with the HDMI cable and carry case.",
      availability: [
        {
          startDate: new Date(Date.now() - 86_400_000).toISOString(),
          endDate: new Date(Date.now() + 90 * 86_400_000).toISOString(),
        },
      ],
    });
  expect(response.status).toBe(201);
  return response.body.data as { id: string };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  const { connectDatabase } = await import("../src/config/database.js");
  const { createApp } = await import("../src/app.js");
  await connectDatabase(mongo.getUri());
  mongoose = (await import("mongoose")).default;
  app = createApp();

  const borrower = await registerUser("borrower@example.com", {
    latitude: 18.489,
    longitude: 73.833,
  });
  borrowerToken = borrower.token;
  borrowerId = borrower.user.id;

  const lender = await registerUser("lender@example.com", {
    latitude: 18.5074,
    longitude: 73.8077,
  });
  lenderToken = lender.token;
  lenderId = lender.user.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  if (collections.length === 0) return;
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  const borrower = await registerUser("borrower-after@example.com");
  borrowerToken = borrower.token;
  borrowerId = borrower.user.id;
  const lender = await registerUser("lender-after@example.com");
  lenderToken = lender.token;
  lenderId = lender.user.id;
});

describe("LENDLY acceptance criteria", () => {
  it("TC01/TC02 registers, logs in, and blocks bad login", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "borrower@example.com", password: "Password123" });
    expect(login.status).toBe(200);
    expect(login.body.data.token).toBeTruthy();

    const badLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "borrower@example.com", password: "WrongPassword1" });
    expect(badLogin.status).toBe(401);
  });

  it("TC03 publishes a listing", async () => {
    const item = await createItem(lenderToken);
    itemId = item.id;

    const mine = await request(app)
      .get("/api/items/mine")
      .set("Authorization", `Bearer ${lenderToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0].itemName).toBe("HD Portable Projector");
  });

  it("TC04/TC06 searches nearby listings and expands the radius", async () => {
    itemId = (await createItem(lenderToken)).id;

    const tooSmall = await request(app)
      .get("/api/items")
      .query({
        q: "Projector",
        latitude: 18.5074,
        longitude: 73.8077,
        radius: 100,
        limit: 5,
      });
    expect(tooSmall.status).toBe(200);
    expect(tooSmall.body.data).toHaveLength(0);

    const expanded = await request(app)
      .get("/api/items")
      .query({
        q: "Projector",
        latitude: 18.5074,
        longitude: 73.8077,
        radius: 20000,
        limit: 5,
      });
    expect(expanded.status).toBe(200);
    expect(expanded.body.data).toHaveLength(1);
    expect(expanded.body.data[0].id).toBe(itemId);
  });

  it("TC07/TC08/TC09/TC10 processes requests and prevents conflicting bookings", async () => {
    itemId = (await createItem(lenderToken)).id;
    const startDate = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const endDate = new Date(Date.now() + 5 * 86_400_000).toISOString();

    const borrowRequest = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${borrowerToken}`)
      .send({
        itemId,
        requestedQuantity: 1,
        startDate,
        endDate,
        message: "Needed for a class demo.",
      });
    expect(borrowRequest.status).toBe(201);
    const requestId = borrowRequest.body.data.id;

    const accepted = await request(app)
      .patch(`/api/requests/${requestId}/accept`)
      .set("Authorization", `Bearer ${lenderToken}`);
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.bookingStatus).toBe("confirmed");

    const conflicting = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${borrowerToken}`)
      .send({
        itemId,
        requestedQuantity: 2,
        startDate,
        endDate,
        message: "Trying to exceed inventory.",
      });
    expect(conflicting.status).toBe(409);
    expect(conflicting.body.error.code).toBe("INSUFFICIENT_INVENTORY");

    const rejected = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${borrowerToken}`)
      .send({
        itemId,
        requestedQuantity: 1,
        startDate,
        endDate,
        message: "Request should be rejected.",
      });
    expect(rejected.status).toBe(201);
    const rejectedId = rejected.body.data.id;
    const reject = await request(app)
      .patch(`/api/requests/${rejectedId}/reject`)
      .set("Authorization", `Bearer ${lenderToken}`);
    expect(reject.status).toBe(200);
    expect(reject.body.data.requestStatus).toBe("rejected");
  });

  it("TC11/TC12/TC13 confirms handover, return, and review", async () => {
    itemId = (await createItem(lenderToken)).id;
    const startDate = new Date(Date.now() - 86_400_000).toISOString();
    const endDate = new Date(Date.now() + 86_400_000).toISOString();

    const requestResponse = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${borrowerToken}`)
      .send({
        itemId,
        requestedQuantity: 1,
        startDate,
        endDate,
      });
    expect(requestResponse.status).toBe(201);
    const requestId = requestResponse.body.data.id;

    const accept = await request(app)
      .patch(`/api/requests/${requestId}/accept`)
      .set("Authorization", `Bearer ${lenderToken}`);
    const bookingId = accept.body.data.id;

    const lenderView = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${lenderToken}`);
    expect(lenderView.status).toBe(200);
    expect(lenderView.body.data.id).toBe(bookingId);
    expect(lenderView.body.data.item.itemName).toBe("HD Portable Projector");
    expect(lenderView.body.data.itemId).toBe(itemId);
    expect(lenderView.body.data.borrower.name).toBe("Test User");
    expect(lenderView.body.data.lender.name).toBe("Test User");

    const borrowerView = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${borrowerToken}`);
    expect(borrowerView.status).toBe(200);
    expect(borrowerView.body.data.borrowerId).toBe(borrowerId);

    const requestView = await request(app)
      .get(`/api/requests/${requestId}`)
      .set("Authorization", `Bearer ${borrowerToken}`);
    expect(requestView.status).toBe(200);
    expect(requestView.body.data.item.itemName).toBe("HD Portable Projector");
    expect(requestView.body.data.borrower.name).toBe("Test User");
    expect(requestView.body.data.lender.name).toBe("Test User");

    const handover = await request(app)
      .patch(`/api/bookings/${bookingId}/handover`)
      .set("Authorization", `Bearer ${borrowerToken}`)
      .send({ initialCondition: "Good, with accessories" });
    expect(handover.status).toBe(200);
    expect(handover.body.data.bookingStatus).toBe("active");

    const returnResponse = await request(app)
      .patch(`/api/bookings/${bookingId}/return`)
      .set("Authorization", `Bearer ${lenderToken}`)
      .send({ finalCondition: "Returned in good condition" });
    expect(returnResponse.status).toBe(200);
    expect(returnResponse.body.data.bookingStatus).toBe("returned");

    const review = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${borrowerToken}`)
      .send({
        bookingId,
        rating: 5,
        communicationRating: 5,
        reliabilityRating: 5,
        itemHandlingRating: 5,
        comment: "Very reliable lender and easy handover.",
      });
    expect(review.status).toBe(201);

    const duplicateReview = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${borrowerToken}`)
      .send({
        bookingId,
        rating: 4,
        communicationRating: 4,
        reliabilityRating: 4,
        itemHandlingRating: 4,
        comment: "This duplicate review should be rejected.",
      });
    expect(duplicateReview.status).toBe(409);

    const profile = await request(app).get(`/api/users/${lenderId}`);
    expect(profile.body.data.averageRating).toBe(5);
  });
});
