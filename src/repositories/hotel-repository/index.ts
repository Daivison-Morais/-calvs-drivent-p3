import { prisma } from "@/config";

async function enrollmentId(userId: number) {
  return prisma.enrollment.findFirst({
    where: {
      userId,
    }
  });
}

async function findTicketTypes(ticketTypeId: number) {
  return prisma.ticketType.findFirst({
    where: {
      id: ticketTypeId,
    }
  });
}
async function findHotels() {
  return prisma.hotel.findMany();
}

async function findOneHotelById(userId: number, hotelId: number) {
  return prisma.hotel.findFirst({
    where: {
      id: hotelId
    }, include: { Rooms: true }
  });
}

const HotelsRepository = {
  findHotels,
  enrollmentId,
  findTicketTypes,
  findOneHotelById
};
  
export default HotelsRepository;
