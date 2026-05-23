"use server"
import { db } from "@/lib/db";

export async function createVisitor(name: string, school: string) {
  try {
    await db.visitor.create({
      data: {
        name,
        schoolOrigin: school,
      },
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}