
import prisma from "../lib/prisma.js";
import bcrypt from 'bcryptjs'

export const createClientUser = async ({ name, lastname, email, password, role }) => {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        lastname,
        email,
        password: await bcrypt.hash(password, 10),
        role: role || 'CLIENTE'
      }
    });

    await tx.clientProfile.create({
      data: {
        userId: user.id
      }
    });

    return user;
  });

};