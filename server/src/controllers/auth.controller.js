import * as authService from '../services/auth.service.js';

export const register = async (req, res) => {
  try {
    const { name, lastname, email, password, phone, role } = req.body;

    // Llamamos al servicio que maneja la transacción y la lógica de herencia
    const newUser = await authService.createClientUser({
      name,
      lastname,
      email,
      password,
      phone,
      role
    });


    const token = 'fake-jwt-token'; 

    // IMPORTANTE: No devolvemos el password (tu test lo requiere)
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    // Si el error es por email duplicado (P2002 en Prisma)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El email ya existe' });
    }
    
    return res.status(400).json({ error: error.message || 'Error en el registro' });
  }
};