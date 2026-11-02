import assert from 'node:assert/strict'
import { test } from 'node:test'

import { utf8 } from '../../src/tools/codec.js'
import { hex, hmac, md5, sha1, sha256, sha384, sha512 } from '../../src/tools/hash.js'

test('hashes match the standard test vectors', () => {
  const abc = utf8('abc')
  assert.equal(hex(md5(abc)), '900150983cd24fb0d6963f7d28e17f72')
  assert.equal(hex(sha1(abc)), 'a9993e364706816aba3e25717850c26c9cd0d89d')
  assert.equal(hex(sha256(abc)), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  assert.equal(
    hex(sha512(abc)),
    'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
  )
  assert.equal(hex(md5(utf8(''))), 'd41d8cd98f00b204e9800998ecf8427e')
  assert.equal(hex(sha256(utf8(''))), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  // Two blocks, and multi-byte UTF-8.
  const long = utf8('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')
  assert.equal(hex(sha256(long)), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1')
  assert.equal(hex(sha1(long)), '84983e441c3bd26ebaae4aa1f95129e5e54670f1')
})

test('HMAC matches RFC 4231 and RFC 2202', () => {
  const key = new Uint8Array(20).fill(0x0b)
  assert.equal(hex(hmac('SHA-256', key, utf8('Hi There'))), 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7')
  assert.equal(hex(hmac('SHA-1', key, utf8('Hi There'))), 'b617318655057264e28bc0b6fb378c8ef146be00')
  assert.equal(hex(hmac('MD5', new Uint8Array(16).fill(0x0b), utf8('Hi There'))), '9294727a3638bb1c13f48ef8158bfc9d')
  assert.equal(
    hex(hmac('SHA-512', key, utf8('Hi There'))),
    '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854'
  )
  // A key longer than the block is hashed first.
  const longKey = new Uint8Array(131).fill(0xaa)
  assert.equal(
    hex(hmac('SHA-256', longKey, utf8('Test Using Larger Than Block-Size Key - Hash Key First'))),
    '60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54'
  )
})

test('SHA-384 and HMAC-SHA-384', () => {
  assert.equal(hex(sha384(utf8('abc'))), 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7')
  assert.equal(hex(hmac('SHA-384', new Uint8Array(20).fill(0x0b), utf8('Hi There'))), 'afd03944d84895626b0825f4ab46907f15f9dadbe4101ec682aa034c7cebc59cfaea9ea9076ede7f4af152e8b2fa9cb6')
})
