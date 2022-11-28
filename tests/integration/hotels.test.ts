import app from "@/app";
import { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { createEnrollmentWithAddress, createTicket, createTicketType, createUser } from "../factories";
import { createHotel } from "../factories/hotels-factory";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

afterEach(async () => {
  await cleanDb();
});

const api = supertest(app);

describe("GET /hotels", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await api.get("/hotels");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  }); 

  describe("when token is valid", () => {
    /* it("should respond with empty array when there are no ticket types created", async () => {
      const token = await generateValidToken();
      const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(response.body).toEqual([]);
    }); */
    it("should response with status 404 if the user has not registered yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      
      const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(404);
    });

    it("should response with status 404 if the user has not ticket yet", async () => {
      const user = await createUser(); 
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      
      const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(404);
    });

    it("should respond with status 409 if the ticket has not been paid", async () => {
      const user = await createUser(); 
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
  
      const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(409);
    });
      
    it("must respond with status 409 if the ticket is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await prisma.ticketType.create({
        data: {
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: true,
          includesHotel: faker.datatype.boolean(),
        },
      });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(409);
    });

    it("must respond with status 409 if ticket does not have a hotel included", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await prisma.ticketType.create({
        data: {
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: false,
          includesHotel: false,
        },
      });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(409);
    });  

    it("should respond with status 200 and with data hotels", async () => {
      const user = await createUser(); 
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await prisma.ticketType.create({
        data: {
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: false,
          includesHotel: true,
        },
      });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
  
      const hotel = await prisma.hotel.create({
        data: {
          name: faker.name.findName(),
          image: faker.image.imageUrl().toString(),
        },
      });
  
      const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual([
        {
          id: hotel.id,
          name: hotel.name,
          image: hotel.image,
          createdAt: hotel.createdAt.toISOString(),
          updatedAt: hotel.updatedAt.toISOString()
        }
      ]);
    });   
  });
});

describe("GET /hotels/:hotelId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await api.get("/hotels/1");
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await api.get("/hotels/1").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await api.get("/hotels/1").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should response with status 404 if the user has not registered yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      
      const response = await api.get("/hotels/1").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(404);
    });

    it("should response with status 404 if the user has not ticket yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      
      const response = await api.get("/hotels/1").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(404);
    });

    it("should respond with status 409 if the ticket has not been paid", async () => {
      const user = await createUser(); 
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
  
      const response = await api.get("/hotels/1").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(409);
    });

    it("must respond with status 409 if the ticket is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await prisma.ticketType.create({
        data: {
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: true,
          includesHotel: faker.datatype.boolean(),
        },
      });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await api.get("/hotels/1").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(409);
    });

    it("must respond with status 409 if ticket does not have a hotel included", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await prisma.ticketType.create({ 
        data: {
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: false,
          includesHotel: false,
        },
      });

      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await api.get("/hotels/1").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(409);
    });

    it("listar os quartos do hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await prisma.ticketType.create({
        data: {
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: false,
          includesHotel: true,
        },
      });
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      
      const Room = await prisma.room.create({
        data: 
          {
            name: faker.name.firstName(),
            capacity: faker.datatype.number({ min: 1, max: 4 }),
            hotelId: hotel.id,
          },
      });

      const response = await api.get(`/hotels/${hotel.id}`).set("Authorization", `Bearer ${token}`);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          image: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          Rooms: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
              capacity: expect.any(Number),
              hotelId: expect.any(Number),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            }),
          ]),
        }),
      );
    });
  });
});

