import { verifyPersonalMessage } from '@mysten/sui.js/verify';
import { NextFunction, Request, Response } from 'express';
import { AppConfig } from '@/config';
import { isEmpty } from '@/utils/util';
import { HttpException, HttpStatus } from '@nestjs/common';

export const verifySignatureValidation = async (
  req: Request & { headers: { signature: string; 'x-wallet-address': string } },
  res: Response,
  next: NextFunction,
) => {
  try {
    const signature = req.headers.signature;
    const walletAddress = req.headers['x-wallet-address'];
    if (isEmpty(signature) || isEmpty(walletAddress)) throw 'missing data in header';

    const signingAddress = await verifyPersonalMessage(new Uint8Array(Buffer.from(AppConfig.signature_msg)), signature);

    const isValid = signingAddress.toSuiAddress() === walletAddress;

    if (isValid) {
      res.locals.walletAddress = walletAddress;
      next();
    } else {
      throw 'Invalid Signer';
    }
  } catch (e) {
    next(new HttpException(`Error on Sig Verification! ${e}`, HttpStatus.FORBIDDEN));
  }
};
