import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { User } from "../models/User.js";
import { Item } from "../models/Item.js";
import { BorrowRequest } from "../models/BorrowRequest.js";
import { Booking } from "../models/Booking.js";
import { Review } from "../models/Review.js";
import { Notification } from "../models/Notification.js";
import { Report } from "../models/Report.js";

const PASSWORD = "Passw0rd";

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86_400_000);
}

async function seed() {
  await connectDatabase();
  await Promise.all([
    User.deleteMany({}),
    Item.deleteMany({}),
    BorrowRequest.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
    Report.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const [, ananya, rohan, isha] = await User.create([
    {
      name: "LENDLY Admin",
      email: "admin@lendly.app",
      passwordHash,
      phone: "+91 90000 00000",
      role: "admin",
      verificationStatus: "verified",
      location: {
        address: "University Administration Block",
        locality: "MIT-ADT University",
        city: "Pune",
        latitude: 18.489,
        longitude: 73.833,
      },
    },
    {
      name: "Ananya Deshpande",
      email: "ananya@lendly.app",
      passwordHash,
      phone: "+91 90000 00001",
      verificationStatus: "verified",
      averageRating: 4.8,
      reviewCount: 2,
      location: {
        address: "Hostel B, Student Housing",
        locality: "MIT-ADT University",
        city: "Pune",
        latitude: 18.4902,
        longitude: 73.8342,
      },
    },
    {
      name: "Rohan Patil",
      email: "rohan@lendly.app",
      passwordHash,
      phone: "+91 90000 00002",
      verificationStatus: "verified",
      averageRating: 4.5,
      reviewCount: 1,
      location: {
        address: "Sunshine Residency, Kothrud",
        locality: "Kothrud",
        city: "Pune",
        latitude: 18.5074,
        longitude: 73.8077,
      },
    },
    {
      name: "Isha Kulkarni",
      email: "isha@lendly.app",
      passwordHash,
      phone: "+91 90000 00003",
      verificationStatus: "pending",
      location: {
        address: "Green Park Society, Baner",
        locality: "Baner",
        city: "Pune",
        latitude: 18.559,
        longitude: 73.7868,
      },
    },
  ]);

  const items = await Item.create([
    {
      ownerId: ananya._id,
      itemName: "HD Portable Projector",
      category: "Projectors & Event Gear",
      description:
        "A compact 1080p projector ideal for project presentations, film screenings, and small community events. Includes HDMI cable and carry case.",
      images: [
        "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1200&q=80",
      ],
      condition: "like-new",
      totalQuantity: 2,
      availableQuantity: 2,
      location: ananya.location!,
      coordinates: { type: "Point", coordinates: [73.8342, 18.4902] },
      rentalPrice: 180,
      borrowingTerms:
        "Return with all accessories. Please avoid food near the projector and report any issue immediately.",
      availability: [
        { startDate: daysFromNow(1), endDate: daysFromNow(90) },
      ],
      listingStatus: "active",
    },
    {
      ownerId: ananya._id,
      itemName: "Scientific Calculator FX-991",
      category: "Books & Stationery",
      description:
        "Reliable scientific calculator for engineering exams and assignments. Includes cover and quick-start guide.",
      images: [
        "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=1200&q=80",
      ],
      condition: "good",
      totalQuantity: 1,
      availableQuantity: 1,
      location: ananya.location!,
      coordinates: { type: "Point", coordinates: [73.8342, 18.4902] },
      rentalPrice: 25,
      borrowingTerms: "Keep it away from water. Return before the last exam day.",
      availability: [{ startDate: daysFromNow(0), endDate: daysFromNow(60) }],
      listingStatus: "active",
    },
    {
      ownerId: rohan._id,
      itemName: "DeWalt Cordless Drill Kit",
      category: "Tools & Equipment",
      description:
        "Professional-grade cordless drill with two batteries, charger, and bit set. Suitable for furniture assembly and household repairs.",
      images: [
        "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1200&q=80",
      ],
      condition: "good",
      totalQuantity: 1,
      availableQuantity: 1,
      location: rohan.location!,
      coordinates: { type: "Point", coordinates: [73.8077, 18.5074] },
      rentalPrice: 220,
      borrowingTerms: "Return fully charged. Wear safety glasses when drilling.",
      availability: [{ startDate: daysFromNow(0), endDate: daysFromNow(45) }],
      listingStatus: "active",
    },
    {
      ownerId: rohan._id,
      itemName: "Camping Tent for Four",
      category: "Travel & Camping",
      description:
        "Weather-resistant four-person tent with rain cover, poles, pegs, and a compact storage bag.",
      images: [
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80",
      ],
      condition: "good",
      totalQuantity: 1,
      availableQuantity: 1,
      location: rohan.location!,
      coordinates: { type: "Point", coordinates: [73.8077, 18.5074] },
      rentalPrice: 350,
      borrowingTerms: "Clean and dry the tent before returning it.",
      availability: [{ startDate: daysFromNow(2), endDate: daysFromNow(75) }],
      listingStatus: "active",
    },
    {
      ownerId: isha._id,
      itemName: "Bluetooth Party Speaker",
      category: "Electronics",
      description:
        "Powerful portable speaker with AUX and Bluetooth support. Great for birthdays and society events.",
      images: [
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80",
      ],
      condition: "like-new",
      totalQuantity: 1,
      availableQuantity: 1,
      location: isha.location!,
      coordinates: { type: "Point", coordinates: [73.7868, 18.559] },
      rentalPrice: 260,
      borrowingTerms: "Return charged. Please do not use it in rain.",
      availability: [{ startDate: daysFromNow(0), endDate: daysFromNow(80) }],
      listingStatus: "active",
    },
    {
      ownerId: isha._id,
      itemName: "Badminton Racquet Set",
      category: "Sports & Fitness",
      description:
        "Two lightweight racquets with covers and three shuttlecocks. Ideal for campus practice matches.",
      images: [
        "https://images.unsplash.com/photo-1613918431703-aa50889e3be9?auto=format&fit=crop&w=1200&q=80",
      ],
      condition: "new",
      totalQuantity: 2,
      availableQuantity: 2,
      location: isha.location!,
      coordinates: { type: "Point", coordinates: [73.7868, 18.559] },
      rentalPrice: 80,
      borrowingTerms: "Return after removing dust. Do not bend the shafts.",
      availability: [{ startDate: daysFromNow(0), endDate: daysFromNow(120) }],
      listingStatus: "active",
    },
  ]);

  const pendingRequest = await BorrowRequest.create({
    itemId: items[0]!._id,
    borrowerId: rohan._id,
    lenderId: ananya._id,
    requestedQuantity: 1,
    startDate: daysFromNow(4),
    endDate: daysFromNow(5),
    message: "Need a projector for our final-year demo.",
    requestStatus: "pending",
  });

  const completedRequest = await BorrowRequest.create({
    itemId: items[1]!._id,
    borrowerId: rohan._id,
    lenderId: ananya._id,
    requestedQuantity: 1,
    startDate: daysFromNow(-10),
    endDate: daysFromNow(-8),
    message: "Required for semester exams.",
    requestStatus: "accepted",
  });

  const completedBooking = await Booking.create({
    requestId: completedRequest._id,
    itemId: items[1]!._id,
    borrowerId: rohan._id,
    lenderId: ananya._id,
    quantity: 1,
    startDate: daysFromNow(-10),
    endDate: daysFromNow(-8),
    rentalAmount: 75,
    bookingStatus: "completed",
    handoverStatus: "confirmed",
    returnStatus: "confirmed",
    initialCondition: "Good condition with cover",
    finalCondition: "Returned in good condition",
    handoverAt: daysFromNow(-10),
    returnedAt: daysFromNow(-8),
  });

  await Review.create({
    bookingId: completedBooking._id,
    reviewerId: rohan._id,
    reviewedUserId: ananya._id,
    rating: 5,
    communicationRating: 5,
    reliabilityRating: 5,
    itemHandlingRating: 5,
    comment: "Ananya shared the calculator on time and explained everything clearly.",
  });

  await Notification.insertMany([
    {
      userId: ananya._id,
      notificationType: "request_received",
      message: "New borrowing request for HD Portable Projector.",
      relatedRequestId: pendingRequest._id,
    },
    {
      userId: rohan._id,
      notificationType: "review_added",
      message: "Ananya left feedback for a completed borrowing.",
      relatedBookingId: completedBooking._id,
    },
  ]);

  await Report.create({
    reporterId: rohan._id,
    targetType: "user",
    targetId: isha._id,
    reason: "other",
    details: "Need help checking whether the speaker listing accessories are complete.",
    status: "open",
  });

  console.log("Seed data created.");
  console.log("Login credentials:");
  console.log(`  admin@lendly.app / ${PASSWORD}`);
  console.log(`  ananya@lendly.app / ${PASSWORD}`);
  console.log(`  rohan@lendly.app / ${PASSWORD}`);
  console.log(`  isha@lendly.app / ${PASSWORD}`);
}

seed()
  .then(() => disconnectDatabase())
  .catch(async (error) => {
    console.error(error);
    await disconnectDatabase();
    process.exit(1);
  });
