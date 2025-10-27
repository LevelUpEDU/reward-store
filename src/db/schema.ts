import {
    boolean,
    check,
    pgEnum,
    pgTable,
    primaryKey,
    varchar,
    integer,
    text,
    timestamp,
    serial,
} from 'drizzle-orm/pg-core'
import {sql} from 'drizzle-orm'
import {generateCourseCode} from './utils'

/* enums */

export const rewardType = pgEnum('reward_type', ['unspecified'])

export const redemptionStatus = pgEnum('redemption_status', [
    'pending',
    'fulfilled',
    'cancelled',
])

export const submissionStatus = pgEnum('submission_status', [
    'pending',
    'approved',
    'rejected',
])

/* User management */

export const student = pgTable('student', {
    email: varchar('email').primaryKey(),
    name: varchar('name').notNull(),
    password: varchar('password').notNull(), // add Password.
    lastSignin: timestamp('last_signin', {mode: 'date'}),
})

export const instructor = pgTable('instructor', {
    email: varchar('email').primaryKey(),
    name: varchar('name').notNull(),
    password: varchar('password').notNull(), // add Password.
    lastSignin: timestamp('last_signin', {mode: 'date'}),
})

export const course = pgTable('course', {
    id: serial('id').primaryKey(),
    courseCode: varchar('course_code', {length: 6})
        .notNull()
        .unique()
        .$defaultFn(() => generateCourseCode()), //
    title: varchar('title', {length: 63}).notNull(),
    description: text('description'),
    instructorEmail: varchar('instructor_email')
        .references(() => instructor.email)
        .notNull(),
})

export const registration = pgTable(
    'registration',
    {
        studentId: varchar('student_id')
            .references(() => student.email)
            .notNull(),
        courseId: integer('course_id')
            .references(() => course.id)
            .notNull(),
    },
    (table) => [primaryKey({columns: [table.studentId, table.courseId]})]
)

/* Quests & rewards */

export const quest = pgTable('quest', {
    id: serial('id').primaryKey(),
    courseId: integer('course_id')
        .references(() => course.id)
        .notNull(),
    createdBy: varchar('created_by')
        .references(() => instructor.email)
        .notNull(),
    title: varchar('title', {length: 63}).notNull(),
    points: integer('points').notNull(),
    createdDate: timestamp('created_date', {mode: 'date'}).notNull(),
    expirationDate: timestamp('expiration_date', {mode: 'date'}),
})

export const submission = pgTable('submission', {
    id: serial('id').primaryKey(),
    studentId: varchar('student_id')
        .references(() => student.email)
        .notNull(),
    questId: integer('quest_id')
        .references(() => quest.id)
        .notNull(),
    submissionDate: timestamp('submission_date', {mode: 'date'}).notNull(),
    status: submissionStatus('status').notNull().default('pending'),
    verifiedBy: varchar('verified_by').references(() => instructor.email),
    verifiedDate: timestamp('verified_date', {mode: 'date'}),
})

export const reward = pgTable(
    'reward',
    {
        id: serial('id').primaryKey(),
        courseId: integer('course_id')
            .references(() => course.id)
            .notNull(),
        createdDate: timestamp('created_date', {mode: 'date'}).notNull(),
        name: varchar('name', {length: 63}).notNull(),
        description: text('description'),
        cost: integer('cost').notNull(),
        quantityLimit: integer('quantity_limit'),
        type: rewardType('reward_type').notNull().default('unspecified'),
        active: boolean('active').notNull().default(true),
    },
    (table) => [
        check('cost_not_negative', sql`${table.cost} >= 0`),
        check(
            'quantity_limit_positive',
            sql`${table.quantityLimit} IS NULL OR ${table.quantityLimit} > 0`
        ),
    ]
)

export const redemption = pgTable('redemption', {
    id: serial('id').primaryKey().unique(),
    studentId: varchar('student_id')
        .references(() => student.email)
        .notNull(),
    rewardId: integer('reward_id')
        .references(() => reward.id)
        .notNull(),
    redemptionDate: timestamp('redemption_date', {
        mode: 'date',
    }).notNull(),
    status: redemptionStatus('status').notNull().default('pending'),
    fulfillmentDate: timestamp('fulfillment_date', {mode: 'date'}),
    instructorNotes: text('instructor_notes'),
    studentNotes: text('student_notes'),
})

export const transaction = pgTable(
    'transaction',
    {
        id: serial('id').primaryKey(),
        studentId: varchar('student_id')
            .references(() => student.email)
            .notNull(),
        points: integer('points').notNull(),
        transactionDate: timestamp('transaction_date', {
            mode: 'date',
        }).notNull(),
        submissionId: integer('submission_id').references(() => submission.id),
        redemptionId: integer('redemption_id').references(() => redemption.id),
    },
    (table) => [
        check(
            // business rule: there must be a way to track where the transaction came from
            'transaction_source_not_null',
            sql`(${table.submissionId} IS NOT NULL AND ${table.redemptionId} IS NULL) OR
              (${table.submissionId} IS NULL AND ${table.redemptionId} IS NOT NULL)`
        ),
    ]
)
