import { Injectable, BadRequestException } from '@nestjs/common';
import * as forge from 'node-forge';
import { randomUUID } from 'crypto';

@Injectable()
export class EimzoService {
  private challenges = new Map<string, { challenge: string; expiresAt: number }>();

  generateChallenge(): { challenge: string; challengeId: string } {
    const challenge   = forge.util.bytesToHex(forge.random.getBytesSync(16));
    const challengeId = randomUUID();
    this.challenges.set(challengeId, { challenge, expiresAt: Date.now() + 5 * 60 * 1000 });
    return { challenge, challengeId };
  }

  parsePkcs7(pkcs7Base64: string, challengeId: string) {
    try {
      const challengeObj = this.challenges.get(challengeId);
      if (!challengeObj || challengeObj.expiresAt < Date.now()) {
        throw new Error('Challenge topilmadi yoki muddati tugagan');
      }
      const expectedChallenge = challengeObj.challenge;
      this.challenges.delete(challengeId);

      // Decode base64
      const der = forge.util.decode64(pkcs7Base64);
      const asn1 = forge.asn1.fromDer(der);
      
      // Parse PKCS#7 message
      const p7 = forge.pkcs7.messageFromAsn1(asn1) as any;
      
      if (!p7.certificates || p7.certificates.length === 0) {
        throw new Error('Sertifikat topilmadi');
      }
      
      const cert = p7.certificates[0];
      const subject = cert.subject.attributes;
      
      let pinfl = '';
      let inn = '';
      let cn = '';
      
      for (const attr of subject) {
        const type = attr.type;
        const name = attr.name || attr.shortName;
        
        if (name === 'commonName' || name === 'CN') {
          cn = attr.value;
        } else if (type === '1.2.860.3.16.1.2') {
          pinfl = attr.value;
        } else if (type === '1.2.860.3.16.1.1') {
          inn = attr.value;
        } else if (name === 'UID' || name === 'uid' || type === '0.9.2342.19200300.100.1.1') {
          if (!pinfl) pinfl = attr.value;
        }
      }

      // In attached PKCS#7, verify content matches the challenge
      if (expectedChallenge && p7.content) {
        const contentStr = forge.util.decodeUtf8(p7.content.getBytes());
        if (contentStr !== expectedChallenge && !contentStr.includes(expectedChallenge)) {
          throw new Error('Imzolangan matn challenge bilan mos kelmadi');
        }
      }

      // Check validity
      const validTo = cert.validity.notAfter;
      if (new Date() > validTo) {
        throw new Error('Sertifikat muddati tugagan');
      }

      if (!pinfl && !inn) {
         throw new Error('Sertifikatdan STIR yoki JSHSHIR topilmadi');
      }

      return { cn, pinfl, inn, validTo };
    } catch (error: any) {
      throw new BadRequestException('Imzoni tekshirishda xatolik: ' + error.message);
    }
  }
}
