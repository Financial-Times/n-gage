const proxyquire = require('proxyquire');
const sinon = require('sinon');
const expect = require('chai').expect;
require('chai').use(require('sinon-chai'));
const requireUncached = require('require-uncached');

describe('get-config', () => {

	after(() => {
		delete process.env.CIRCLECI;
	});

	it('writes in simple format', (done) => {
		const fetch = sinon.stub();
		const writeFileSync = sinon.spy();
		process.env.CIRCLECI = 1;
		fetch.withArgs('https://vault.in.ft.com/v1/auth/approle/login', sinon.match.object).returns(Promise.resolve({ auth: { client_token: 'mytoken' }}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/production', sinon.match.object).returns(Promise.resolve({ data: { a: 'z' }}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/shared', sinon.match.object).returns(Promise.resolve({ data: { env: [ 'b' ]}}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/shared/production', sinon.match.object).returns(Promise.resolve({ data: { b: 'y' }}));
		const script = proxyquire('../scripts/get-config', {
			'yargs': { argv: require('yargs')(['', '', '--app', 'myapp', '--env', 'prod', '--format', 'simple']).argv },
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
		process.env.CIRCLECI = 1;
		fetch.withArgs('https://vault.in.ft.com/v1/auth/approle/login', sinon.match.object).returns(Promise.resolve({ auth: { client_token: 'mytoken' }}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/development', { headers: { 'X-Vault-Token': 'mytoken' }}).returns(Promise.resolve({ data: { a: 'z' }}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/shared', { headers: { 'X-Vault-Token': 'mytoken' }}).returns(Promise.resolve({ data: { env: [ 'b' ]}}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/shared/development', { headers: { 'X-Vault-Token': 'mytoken' }}).returns(Promise.resolve({ data: { b: 'y' }}));
		const script = proxyquire('../scripts/get-config', {
			'yargs': { argv: require('yargs')(['', '', '--app', 'myapp', '--env', 'dev', '--format', 'json']).argv },
			'@financial-times/n-fetch': fetch,
			'fs': { writeFileSync }
		});
		setTimeout(() => {
			expect(writeFileSync).to.have.been.called;
			expect(writeFileSync).to.have.been.calledWith(sinon.match.string, '{\n  "b": "y",\n  "a": "z"\n}');
			done();
		}, 0);
	});

	it('uses local token if not on CircleCI', (done) => {
		const fetch = sinon.stub();
		const homedir = sinon.stub();
		const readFile = (path, opts, cb) => {
			if (path === '/path/to/home/.vault-token') {
				cb(null, 'my-token');
			}
		};
		const writeFileSync = sinon.spy();
		delete process.env.CIRCLECI;
		homedir.returns('/path/to/home');
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/production', { headers: { 'X-Vault-Token': 'my-token' }}).returns(Promise.resolve({ data: { a: 'z' }}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/shared', { headers: { 'X-Vault-Token': 'my-token' }}).returns(Promise.resolve({ data: { env: [ 'b' ]}}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/shared/production', { headers: { 'X-Vault-Token': 'my-token' }}).returns(Promise.resolve({ data: { b: 'y' }}));
		const script = proxyquire('../scripts/get-config', {
			'yargs': { argv: require('yargs')(['', '', '--app', 'myapp', '--env', 'prod', '--format', 'simple']).argv },
			'@financial-times/n-fetch': fetch,
			'fs': { readFile, writeFileSync },
			'os': { homedir }
		});
		setTimeout(() => {
			expect(writeFileSync).to.have.been.called;
			expect(writeFileSync).to.have.been.calledWith(sinon.match.string, 'a=z\nb=y\n');
			done();
		}, 0);
	});

	it('extracts env from payload if continuous integration', (done) => {
		const fetch = sinon.stub();
		const writeFileSync = sinon.spy();
		process.env.CIRCLECI = 1;
		fetch.withArgs('https://vault.in.ft.com/v1/auth/approle/login', sinon.match.object).returns(Promise.resolve({ auth: { client_token: 'mytoken' }}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/continuous-integration', sinon.match.object).returns(Promise.resolve({ data: { env: { a: 'z' }}}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/shared', sinon.match.object).returns(Promise.resolve({ data: {}}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/shared/continuous-integration', sinon.match.object).returns(Promise.resolve({ data: { b: 'y' }}));
		const script = proxyquire('../scripts/get-config', {
			'yargs': { argv: require('yargs')(['', '', '--app', 'myapp', '--env', 'ci', '--format', 'simple']).argv },
			'@financial-times/n-fetch': fetch,
			'fs': { writeFileSync }
		});
		setTimeout(() => {
			expect(writeFileSync).to.have.been.called;
			expect(writeFileSync).to.have.been.calledWith(sinon.match.string, 'a=z\nb=y\n');
			done();
		}, 0);
	});

});