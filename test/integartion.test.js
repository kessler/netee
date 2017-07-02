const { expect } = require('chai')
const net = require('net')
const _ = require('lodash')
const async = require('async')
const Netee = require('../index')
const simplyWait = require('simply-wait')

describe('netee', function() {
	//this.timeout(10000)

	let dest1, dest2, netee, client

	it('listens for connections on a given port', (done) => {
		client.connect(9000, (err) => {
			if (err) return done(err)
		})

		client.on('connect', done)
	})

	it('keeps count of active connections', (done) => {
		expect(netee.activeConnections).to.equal(0)

		let connectWait = simplyWait(() => {
			expect(netee.activeConnections).to.equal(2)
			c1.end()
		})

		function c1OnClose() {
			expect(netee.activeConnections).to.equal(1)
			c2.end()
		}

		function c2OnClose(hadError) {
			if (hadError) {
				return done(new Error('was expecting a clean disconnection'))
			}
			expect(netee.activeConnections).to.equal(0)
			done()
		}

		let c1 = new net.Socket()
		let c2 = new net.Socket()

		c1.on('connect', connectWait())
		c1.on('close', c1OnClose)
		c2.on('connect', connectWait())
		c2.on('close', c2OnClose)

		c1.connect(9000, (err) => {
			if (err) return done(err)
		})

		c2.connect(9000, (err) => {
			if (err) return done(err)
		})
	})

	it('keeps count of active connections when an error occurs', (done) => {
		expect(netee.activeConnections).to.equal(0)

		let c1 = new net.Socket()

		c1.on('connect', () => {
			setTimeout(() => {
				expect(netee.activeConnections).to.equal(1)
				c1.destroy()
				setTimeout(() => {
					expect(netee.activeConnections).to.equal(0)
					done()
				}, 100)
			}, 100)			
		})

		c1.on('error', (err) => {
			console.error(err)
		})

		c1.connect(9000, (err) => {
			if (err) return done(err)
		})
	})

	it('duplicate traffic to two destinations', (done) => {

		done()
	})

	beforeEach((done) => {
		client = new net.Socket()
		client.on('error', (err) => {
			console.error('client error, this might be ok...')
			console.error(err)
		})

		Netee.listen(9000, (err, server) => {
			if (err) return done(err)
			netee = server
			done()
		})
	})

	afterEach((done) => {
		if (client && !client.destroyed) {
			client.end()
		}

		netee.shutdown((err) => {
			if (err) return done(err)

			// spawning servers rapidly on the same port doesn't work very well
			setTimeout(done, 200)
		})
	})

	function createServer(port, cb) {
		let server = net.createServer()
		server.listen(port, (err) => {
			if (err) return cb(err)
			cb(null, server)
		})
	}

	function closeServer(server, name, cb) {
		server.close((err) => {
			if (err) {
				console.error(`error while closing server ${name}`)
				console.error(err)
			}

			cb()
		})
	}
})
