import { AuthenticatedRequest } from "@/middlewares";
import hotelsServices from "@/services/hotels-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  try {
    const hotels = await hotelsServices.gethotels(userId);
    return res.status(httpStatus.OK).send(hotels);
  } catch (error) {
    if (error.name === "ConflictError") {
      return res.status(409).send(error.name);
    }
    if (error.name === "NotFoundError") {
      return res.send(httpStatus.NOT_FOUND);
    }
    return res.sendStatus(httpStatus.NO_CONTENT);
  }
}

export async function getHotelById(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const hotelId = Number(req.params.hotelId);
  try {
    const hotel = await hotelsServices.findOneHotelById(userId, hotelId);
    return res.status(httpStatus.OK).send(hotel);
  } catch (error) {
    if (error.name === "ConflictError") {
      return res.status(409).send(error.name);
    }
    if (error.name === "NotFoundError") {
      return res.send(httpStatus.NOT_FOUND);
    }
    return res.sendStatus(httpStatus.NO_CONTENT);
  }
}

