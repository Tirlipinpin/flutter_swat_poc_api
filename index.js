import Fastify from 'fastify'
import fastifyCors from 'fastify-cors'
import { v4 as uuidv4 } from 'uuid'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const fastify = Fastify({
  logger: true
})

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use JSON file for storage
const file = join(__dirname, 'json/calendar.json')
const adapter = new JSONFile(file)
const db = new Low(adapter)


// Read data from JSON file, this will set db.data content
db.read().then(() => (
  console.log(db.data)
))

fastify.register(fastifyCors, { 
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'OPTIONS']
})

fastify.post('/login', async (request, reply) => {
  console.log(request.body)
  if (request.body.email === 'admin@one2team.com' && request.body.password === 'admin') {
    // auth success
    reply.code(200);
    setTimeout(() => {
      reply.send({ token: uuidv4() })
    }, 500);
  } else {
    // status code 401
    reply.code(401);
    reply.send({ error: 'Invalid credentials' })
  }
});

fastify.get('/calendar', async (request, reply) => {
  if (request.headers.authorization) {
    console.log('[GET] /calendar > ', request.headers.authorization)
    reply.code(200);
    setTimeout(() => {
      reply.send(db.data)
    }, 500);
  }
})

fastify.post('/test-401', (request, reply) => {
  reply.code(401);
  reply.send({ error: 'Session expired' })
})

fastify.put('/calendar/assignment', async (request, reply) => {
  const body = request.body
  console.log('[PUT] /calendar/assignment > ', request.body)
  reply.code(200);

  const day = db.data.days.find((day) => day.date === body.date)
  if (!day) {
    reply.code(404)
    reply.send({ message: 'day not found' })
    return
  }

  const assignment = day.assignments?.find((assignment) => assignment.project_id === body.project_id)

  let newAssignment = {}

  if (assignment) {
    assignment.hours = body.hours

    newAssignment = { ...assignment }
  } else {
    newAssignment = {
      project_id: body.project_id,
      hours: body.hours,
      id: uuidv4()
    }
    day.assignments.push(newAssignment)
  }

  db.write().then(
    reply.send(db.data)
  )
})

// Run the server!
const start = async () => {
  try {
    await fastify.listen(5050)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()