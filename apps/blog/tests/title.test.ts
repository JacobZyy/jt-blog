/* eslint-disable test/no-import-node-test */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { postSlug, routeTitle } from '../src/lib/title.ts'

const posts = [{ slug: 'hello-world', title: 'Hello World' }]

test('maps routes to browser titles', () => {
  assert.equal(routeTitle('/', posts), 'jacob-z')
  assert.equal(routeTitle('/posts', posts), 'Posts')
  assert.equal(routeTitle('/posts/hello-world', posts), 'Hello World')
  assert.equal(routeTitle('/posts/missing', posts, true), 'Post')
  assert.equal(routeTitle('/posts/missing', posts), '404')
  assert.equal(routeTitle('/missing', posts), '404')
  assert.equal(postSlug('/posts/hello%20world'), 'hello world')
})
