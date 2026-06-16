import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

jest.setTimeout(180000); // 3 minutes

describe('Day 8 Final Audit (E2E)', () => {
  let app: INestApplication;
  let patientToken: string;
  let doctorToken: string;
  let doctorId: number;
  let appointmentId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    const timestamp = Date.now();
    const dEmail = `audit_doc_${timestamp}@test.com`;
    const pEmail = `audit_pat_${timestamp}@test.com`;

    // Signups
    const dSignup = await request(app.getHttpServer()).post('/auth/signup')
      .send({ email: dEmail, password: 'password123', name: 'Audit Doctor', role: 'DOCTOR' })
      .expect(HttpStatus.CREATED);
    const pSignup = await request(app.getHttpServer()).post('/auth/signup')
      .send({ email: pEmail, password: 'password123', name: 'Audit Patient', role: 'PATIENT' })
      .expect(HttpStatus.CREATED);

    // Logins
    const dLogin = await request(app.getHttpServer()).post('/auth/login')
      .send({ email: dEmail, password: 'password123' })
      .expect(HttpStatus.OK);
    const pLogin = await request(app.getHttpServer()).post('/auth/login')
      .send({ email: pEmail, password: 'password123' })
      .expect(HttpStatus.OK);
    doctorToken = dLogin.body.accessToken;
    patientToken = pLogin.body.accessToken;

    // Setup Doctor Profile
    const dProfile = await request(app.getHttpServer()).post('/doctor/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ fullName: 'Dr. Auditor', specialization: 'Testing', experience: 5, qualification: 'QA', consultationFee: 100, availability: 'Always' })
      .expect(HttpStatus.CREATED);
    doctorId = dProfile.body.id || (dProfile.body.data && dProfile.body.data.id);

    // Setup Patient Profile
    await request(app.getHttpServer()).post('/patient/profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ fullName: 'Mr. Tester', age: 25, gender: 'Male', contactDetails: '999' })
      .expect(HttpStatus.CREATED);

    // Setup Availability for Doctor (June 30, 2026)
    await request(app.getHttpServer()).post('/doctor/availability/override')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ date: '2026-06-30', slots: [{ startTime: '10:00', endTime: '12:00' }] })
      .expect(HttpStatus.CREATED);
  }, 180000);

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Verification Suite', () => {
    it('REQ-1: should book appointment and enforce constraints', async () => {
      // Success case
      const res = await request(app.getHttpServer()).post('/appointment').set('Authorization', `Bearer ${patientToken}`)
        .send({ doctorId, date: '2026-06-30', startTime: '10:00', endTime: '10:30' });
      expect(res.status).toBe(HttpStatus.CREATED);
      const data = res.body.data || res.body;
      expect(data.status).toBe('BOOKED');
      appointmentId = data.id;

      // Duplicate case
      const resDup = await request(app.getHttpServer()).post('/appointment').set('Authorization', `Bearer ${patientToken}`)
        .send({ doctorId, date: '2026-06-30', startTime: '10:00', endTime: '10:30' });
      expect(resDup.status).toBe(HttpStatus.CONFLICT);

      // Past date case
      const resPast = await request(app.getHttpServer()).post('/appointment').set('Authorization', `Bearer ${patientToken}`)
        .send({ doctorId, date: '2020-01-01', startTime: '10:00', endTime: '10:30' });
      expect(resPast.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('REQ-2&4: should verify Patient and Doctor dashboard views', async () => {
      const pRes = await request(app.getHttpServer()).get('/appointment/my').set('Authorization', `Bearer ${patientToken}`);
      expect(pRes.status).toBe(HttpStatus.OK);
      expect((pRes.body.data || pRes.body).length).toBeGreaterThan(0);

      const dRes = await request(app.getHttpServer()).get('/doctor/appointments').set('Authorization', `Bearer ${doctorToken}`);
      expect(dRes.status).toBe(HttpStatus.OK);
      expect((dRes.body.data || dRes.body).length).toBeGreaterThan(0);
    });

    it('REQ-3: should verify secure cancellation logic', async () => {
      const res = await request(app.getHttpServer()).patch(`/appointment/${appointmentId}/cancel`).set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(HttpStatus.OK);
      expect((res.body.data || res.body).status).toBe('CANCELLED');

      // Unauthorized cancellation
      const resDoc = await request(app.getHttpServer()).patch(`/appointment/${appointmentId}/cancel`).set('Authorization', `Bearer ${doctorToken}`);
      expect(resDoc.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('REQ-AI: should verify AI Agent tool-calling logic', async () => {
      const res = await request(app.getHttpServer()).post('/ai/chat').set('Authorization', `Bearer ${patientToken}`)
        .send({ message: 'What are the slots for Dr. Auditor on June 30th?' });
      expect(res.status).toBe(HttpStatus.OK);
      expect(['get_available_slots', 'search_doctors']).toContain(res.body.toolUsed);
    });
  });
});
