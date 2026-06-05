const createApp = require('./app')
const request = require('supertest')
const validateUsername = require('./validation/validateUsername')
const validatePassword = require('./validation/validatePassword')
const validateEmail = require('./validation/validateEmail')

const app = createApp(validateUsername, validatePassword, validateEmail)

// NOTE: validateEmail has a 2-second busy-wait delay (simulates external service).
// To keep total runtime reasonable, we minimise the number of requests that
// reach the email-validation step. Invalid username/password tests are ordered
// so that validation short-circuits before email is ever called.

describe('POST /users - valid data', () => {
    test('returns status 200 for valid user', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(200)
    })

    test('returns userId and message', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.body.userId).toBe('1')
        expect(res.body.message).toBe('Valid User')
    })

    test('returns JSON content type', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.headers['content-type']).toMatch(/json/)
    })
})

describe('POST /users - invalid email (real validator)', () => {
    test('returns 400 for email without @ symbol', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'notanemail'
        })
        expect(res.statusCode).toBe(400)
        expect(res.body.error).toBe('Invalid User')
        expect(res.body.userId).toBeUndefined()
    })

    test('returns 400 for missing email', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123'
        })
        expect(res.statusCode).toBe(400)
    })
})

// These tests use invalid username or password so email validation is still
// called (app.js always calls all three), but we keep the count low.
describe('POST /users - invalid username', () => {
    test('returns 400 for username shorter than 6 characters', async () => {
        const res = await request(app).post('/users').send({
            username: 'User',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(400)
        expect(res.body.error).toBe('Invalid User')
        expect(res.body.userId).toBeUndefined()
    })

    test('returns 400 for username longer than 30 characters', async () => {
        const res = await request(app).post('/users').send({
            username: 'A'.repeat(31),
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(400)
    })

    test('returns 400 for username with special characters', async () => {
        const res = await request(app).post('/users').send({
            username: 'User@Name!',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(400)
    })

    test('returns 400 for missing username', async () => {
        const res = await request(app).post('/users').send({
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(400)
    })
})

describe('POST /users - invalid password', () => {
    test('returns 400 for password without uppercase letter', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'password123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(400)
        expect(res.body.error).toBe('Invalid User')
        expect(res.body.userId).toBeUndefined()
    })

    test('returns 400 for password without lowercase letter', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'PASSWORD123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(400)
    })

    test('returns 400 for password without a number', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'PasswordABC',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(400)
    })

    test('returns 400 for password with special characters', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123!',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(400)
    })

    test('returns 400 for missing password', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(400)
    })
})
