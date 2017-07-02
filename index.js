'use strict'

const { Duplex } = require('stream')
const { createServer } = require('net')
const debug = require('debug')('netee')
const async = require('async')

class Netee {

	constructor(port, deliveryStrategy, replyStrategy, endpointOptions) {
		debug('Ctor() %d', port)
		this._port = port
		this._activeConnections = new Set()
		this._server = createServer(endpointOptions, (connection) => {
			this._onConnection(connection)
		})

		this._backends = new Set()
		this._lead = undefined
	}

	get activeConnections() {
		return this._activeConnections.size
	}

	addBackend(port, host, callback) {

	}

	listen(callback) {
		debug('listen()')
		this._server.listen(this._port, (err) => {
			if (err) return callback(err)

			debug('listen() success')
			callback(null, this)
		})
	}

	close(callback) {
		debug('close()')
		this._server.close(callback)
	}

	shutdown(callback) {
		debug('shutdown()')
		async.each(this._activeConnections, (conn, cb) => {
			conn.end(cb)
		}, (err) => {
			this.close((serverError) => {
				// TODO not sure about this... maybe better to ignore client socket errors or not shutdown if they don't?
				if (serverError) {
					return callback(serverError)
				}

				if (err) {
					return callback(err)
				}

				debug('shutdown() complete')
				callback()
			})
		})
	}

	_onConnection(connection) {
		debug('_onConnection() incoming connection')
		this._activeConnections.add(connection)

		connection.on('end', () => {
			debug('_onConnection() connection end')
			this._activeConnections.delete(connection)
		})

		connection.on('error', (err) => {
			debug('_onConnection() connection error %o', err)
			this._activeConnections.delete(connection)
		})
	}

	static create(port) {
		return new Netee(port)
	}

	static listen(port, callback) {
		let netee = new Netee(port)

		return netee.listen(callback)
	}
}

module.exports = Netee
