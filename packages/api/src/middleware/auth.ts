import { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/env';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ success: false, error: 'Token inválido ou expirado' });
  }
}

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as any;
    if (user.role !== 'admin') {
      return reply.status(403).send({ success: false, error: 'Acesso restrito a administradores' });
    }
  } catch (err) {
    return reply.status(401).send({ success: false, error: 'Token inválido ou expirado' });
  }
}

export async function ownerOrAdminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ success: false, error: 'Token inválido ou expirado' });
  }
}
