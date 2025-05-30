import { db } from './index';
import { users, User, NewUser } from './schema/users';
import { campaigns, Campaign, NewCampaign } from './schema/campaigns';
import { donations, Donation, NewDonation } from './schema/donations';
import { medicalRecords, MedicalRecord, NewMedicalRecord } from './schema/medicalRecords';
import { paymentMethods, PaymentMethod, NewPaymentMethod } from './schema/paymentMethods';
import { eq, and, or, desc, asc, count, sql } from 'drizzle-orm';

// User operations
export const findUserById = async (id: string): Promise<User | undefined> => {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
};

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
};

export const createUser = async (data: NewUser): Promise<User> => {
  const result = await db.insert(users).values(data).returning();
  return result[0];
};

export const updateUser = async (id: string, data: Partial<NewUser>): Promise<User | undefined> => {
  const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
  return result[0];
};

// Campaign operations
export const findCampaignById = async (id: string): Promise<Campaign | undefined> => {
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result[0];
};

export const getUserCampaigns = async (userId: string): Promise<Campaign[]> => {
  return db.select().from(campaigns).where(eq(campaigns.userId, userId));
};

export const createCampaign = async (data: NewCampaign): Promise<Campaign> => {
  const result = await db.insert(campaigns).values(data).returning();
  return result[0];
};

export const updateCampaign = async (id: string, data: Partial<NewCampaign>): Promise<Campaign | undefined> => {
  const result = await db.update(campaigns).set(data).where(eq(campaigns.id, id)).returning();
  return result[0];
};

// Donation operations
export const createDonation = async (data: NewDonation): Promise<Donation> => {
  const result = await db.insert(donations).values(data).returning();
  
  // Update campaign raised amount
  const donation = result[0];
  const campaign = await findCampaignById(donation.campaignId);
  
  if (campaign && donation.status === 'completed') {
    const newRaised = Number(campaign.raised) + Number(donation.amount);
    await updateCampaign(campaign.id, { raised: newRaised.toString() });
  }
  
  return donation;
};

export const getCampaignDonations = async (campaignId: string): Promise<Donation[]> => {
  return db.select().from(donations).where(eq(donations.campaignId, campaignId));
};

export const getUserDonations = async (userId: string): Promise<Donation[]> => {
  return db.select().from(donations).where(eq(donations.userId, userId));
};

// Medical Records operations
export const getUserMedicalRecords = async (userId: string): Promise<MedicalRecord[]> => {
  return db.select().from(medicalRecords).where(eq(medicalRecords.userId, userId));
};

export const createMedicalRecord = async (data: NewMedicalRecord): Promise<MedicalRecord> => {
  const result = await db.insert(medicalRecords).values(data).returning();
  return result[0];
};

// Payment Methods operations
export const getUserPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  return db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId));
};

export const createPaymentMethod = async (data: NewPaymentMethod): Promise<PaymentMethod> => {
  // If this is the default payment method, unset other defaults
  if (data.isDefault) {
    await db.update(paymentMethods)
      .set({ isDefault: false })
      .where(and(
        eq(paymentMethods.userId, data.userId),
        eq(paymentMethods.isDefault, true)
      ));
  }
  
  const result = await db.insert(paymentMethods).values(data).returning();
  return result[0];
}; 