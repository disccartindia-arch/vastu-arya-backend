/// <reference types="node" />
import jwt from 'jsonwebtoken';

const env = (process as any).env;

export const generateToken = (id: string, role: string): string => {
  return jwt.sign(
    { id, role },
    env.JWT_SECRET as string,
    { expiresIn: env.JWT_EXPIRES_IN || '30d' } as any
  );
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, env.JWT_SECRET as string);
};
