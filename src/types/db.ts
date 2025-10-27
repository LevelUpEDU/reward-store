import type {
    student,
    instructor,
    quest,
    submission,
    transaction,
    reward,
    redemption,
    course,
    registration,
} from '@/db/schema'

export type Student = typeof student.$inferSelect
export type Instructor = typeof instructor.$inferSelect
export type Quest = typeof quest.$inferSelect
export type Submission = typeof submission.$inferSelect
export type Transaction = typeof transaction.$inferSelect
export type Reward = typeof reward.$inferSelect
export type Redemption = typeof redemption.$inferSelect
export type Course = typeof course.$inferSelect
export type Registration = typeof registration.$inferSelect
