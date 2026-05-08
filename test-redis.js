const { Redis } = require('@upstash/redis')

const redis = new Redis({
  url: 'https://more-bee-117379.upstash.io',
  token: 'gQAAAAAAAcqDAAIgcDFlNzZhN2E4ZGI0MDg0MzBiYTk5N2M4ODU2MDE3MzQ2Nw'
})

async function testRedis() {
  await redis.set('test', 'ReplyFlow')

  const data = await redis.get('test')

  console.log(data)
}

testRedis()