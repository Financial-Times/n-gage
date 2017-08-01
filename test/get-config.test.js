const proxyquire = require('proxyquire');
const sinon = require('sinon');
const expect = require('chai').expect;
require('chai').use(require('sinon-chai'));
const requireUncached = require('require-uncached');

describe('get-config', () => {

	it('writes in simple format', (done) => {
		const fetch = sinon.stub();
		const writeFileSync = sinon.spy();
		fetch.withArgs('https://vault.in.ft.com/v1/auth/approle/login', sinon.match.object).returns(Promise.resolve({ auth: { client_token: 'mytoken' }}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/production', sinon.match.object).returns(Promise.resolve({ data: { a: 'z' }}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/shared', sinon.match.object).returns(Promise.resolve({ data: { env: [ 'b' ]}}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/shared/production', sinon.match.object).returns(Promise.resolve({ data: { b: 'y' }}));
		const script = proxyquire('../scripts/get-config', {
			'yargs': { argv: require('yargs')(['', '', '--app', 'myapp', '--env', 'production', '--format', 'simple']).argv },
			'@financial-times/n-fetch': fetch,
			'fs': { writeFileSync }
		});
		setTimeout(() => {
			expect(writeFileSync).to.have.been.called;
			expect(writeFileSync).to.have.been.calledWith(sinon.match.string, 'a=z\nb=y\n');
			done();
		}, 0);
	});

	it('writes in JSON format', (done) => {
		const fetch = sinon.stub();
		const writeFileSync = sinon.spy();
		fetch.withArgs('https://vault.in.ft.com/v1/auth/approle/login', sinon.match.object).returns(Promise.resolve({ auth: { client_token: 'mytoken' }}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/production', sinon.match.object).returns(Promise.resolve({ data: { a: 'z' }}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/shared', sinon.match.object).returns(Promise.resolve({ data: { env: [ 'b' ]}}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/shared/production', sinon.match.object).returns(Promise.resolve({ data: { b: 'y' }}));
		const script = proxyquire('../scripts/get-config', {
			'yargs': { argv: require('yargs')(['', '', '--app', 'myapp', '--env', 'production', '--format', 'json']).argv },
			'@financial-times/n-fetch': fetch,
			'fs': { writeFileSync }
		});
		setTimeout(() => {
			expect(writeFileSync).to.have.been.called;
			expect(writeFileSync).to.have.been.calledWith(sinon.match.string, '{\n  "b": "y",\n  "a": "z"\n}');
			done();
		}, 0);
	});

});