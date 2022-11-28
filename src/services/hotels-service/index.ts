import { conflictError, notFoundError } from "@/errors";
import HotelsRepository from "@/repositories/hotel-repository";
import ticketRepository from "@/repositories/ticket-repository";

async function gethotels(userId: number) {
  const enrollment = await HotelsRepository.enrollmentId(userId);
  if (!enrollment) throw notFoundError();
  
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw notFoundError();
  if (ticket.status === "RESERVED") throw conflictError("ticket no paid!");

  const ticketType = await HotelsRepository.findTicketTypes(ticket.ticketTypeId);
  if (ticketType.isRemote === true) throw conflictError("ticket is of remote type");

  if (ticketType.includesHotel === false) throw conflictError("ticket is of remote type");

  const hotels = await HotelsRepository.findHotels();
  if (!hotels) {
    throw notFoundError();
  } 
  return hotels; 
}

async function findOneHotelById(userId: number, hotelId: number) {
  const enrollment = await HotelsRepository.enrollmentId(userId);
  if (!enrollment) throw notFoundError();
  
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw notFoundError();
  if (ticket.status === "RESERVED") throw conflictError("ticket no paid!");

  const ticketType = await HotelsRepository.findTicketTypes(ticket.ticketTypeId);
  if (ticketType.isRemote === true) throw conflictError("ticket is of remote type");

  if (ticketType.includesHotel === false) throw conflictError("ticket is of remote type");

  const hotel = await HotelsRepository.findOneHotelById(userId, hotelId);
  return hotel;
}

const hotelsServices = {
  gethotels,
  findOneHotelById
};
  
export default hotelsServices;
