const createApp = require('./app')
const request = require('supertest')
const validateUsername = require('./validation/validateUsername')
const validatePassword = require('./validation/validatePassword')

// Mock validateEmail to skip the 2-second busy-wait delay
jest.mock('./validation/validateEmail', () => {
    return jest.fn((email) => {
        if (!email || typeof email !== 'string') return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
        return re.test(email);
    })
})

const validateEmail = require('./validation/validateEmail')
const app = createApp(validateUsername, validatePassword, validateEmail)

describe('POST /users - valid data', () => {
    test('returns status 200 for valid user', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(200)
    })

    test('returns userId in response', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.body.userId).toBeDefined()
        expect(res.body.userId).toBe('1')
    })

    test('returns success message', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'user@example.com'
        })
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

    test('accepts username with exactly 6 characters', async () => {
        const res = await request(app).post('/users').send({
            username: 'ABCDEF',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(200)
    })

    test('accepts username with exactly 30 characters', async () => {
        const res = await request(app).post('/users').send({
            username: 'A'.repeat(30),
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(200)
    })

    test('accepts username with letters, numbers and periods', async () => {
        const res = await request(app).post('/users').send({
            username: 'User.123',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(200)
    })

    test('accepts password with exactly 8 characters', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Passw0rd',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(200)
    })

    test('accepts email with .org domain extension', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'user@example.org'
        })
        expect(res.statusCode).toBe(200)
    })

    test('accepts email with .edu domain extension', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'student@university.edu'
        })
        expect(res.statusCode).toBe(200)
    })
})

describe('POST /users - invalid username', () => {
    test('returns 400 for username shorter than 6 characters', async () => {
        const res = await request(app).post('/users').send({
            username: 'User',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(400)
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

    test('returns error message for invalid username', async () => {
        const res = await request(app).post('/users').send({
            username: 'bad',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(res.body.error).toBe('Invalid User')
        expect(res.body.userId).toBeUndefined()
    })
})

describe('POST /users - invalid password', () => {
    test('returns 400 for password shorter than 8 characters', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Pass1',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(400)
    })

    test('returns 400 for password without uppercase letter', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'password123',
            email: 'user@example.com'
        })
        expect(res.statusCode).toBe(400)
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

    test('returns error and no userId for invalid password', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'badpass',
            email: 'user@example.com'
        })
        expect(res.body.error).toBe('Invalid User')
        expect(res.body.userId).toBeUndefined()
    })
})

describe('POST /users - invalid email', () => {
    test('returns 400 for email without @ symbol', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'notanemail'
        })
        expect(res.statusCode).toBe(400)
    })

    test('returns 400 for email without domain extension', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'user@nodot'
        })
        expect(res.statusCode).toBe(400)
    })

    test('returns 400 for missing email', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123'
        })
        expect(res.statusCode).toBe(400)
    })

    test('returns 400 for empty email string', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: ''
        })
        expect(res.statusCode).toBe(400)
    })

    test('returns error and no userId for invalid email', async () => {
        const res = await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'invalid-email'
        })
        expect(res.body.error).toBe('Invalid User')
        expect(res.body.userId).toBeUndefined()
    })
})

describe('validateEmail mock behaviour', () => {
    test('mock is called with the email argument', async () => {
        validateEmail.mockClear()
        await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(validateEmail).toHaveBeenCalledWith('user@example.com')
    })

    test('mock is called once per request', async () => {
        validateEmail.mockClear()
        await request(app).post('/users').send({
            username: 'ValidUser',
            password: 'Password123',
            email: 'user@example.com'
        })
        expect(validateEmail).toHaveBeenCalledTimes(1)
    })
})
