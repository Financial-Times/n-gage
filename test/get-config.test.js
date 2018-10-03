const proxyquire = require('proxyquire');
const sinon = require('sinon');
const expect = require('chai').expect;
const yargs = require('yargs');
require('chai').use(require('sinon-chai'));

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

		const {builder, handler} = proxyquire('../scripts/commands/get-config', {
			'@financial-times/n-fetch': fetch,
			'fs': { writeFileSync }
		});

		const args = builder(yargs(['', '', '--app', 'myapp', '--env', 'prod', '--format', 'simple'])).argv;

		handler(args);

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

		const {builder, handler} = proxyquire('../scripts/commands/get-config', {
			'@financial-times/n-fetch': fetch,
			'fs': { writeFileSync }
		})

		const args = builder(yargs(['', '', '--app', 'myapp', '--env', 'dev', '--format', 'json'])).argv;

		handler(args);

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

		const {builder, handler} = proxyquire('../scripts/commands/get-config', {
			'@financial-times/n-fetch': fetch,
			'fs': { readFile, writeFileSync },
			'os': { homedir }
		});

		const args = builder(yargs(['', '', '--app', 'myapp', '--env', 'prod', '--format', 'simple'])).argv;

		handler(args);

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

		const {builder, handler} = proxyquire('../scripts/commands/get-config', {
			'@financial-times/n-fetch': fetch,
			'fs': { writeFileSync }
		});

		const args = builder(yargs(['', '', '--app', 'myapp', '--env', 'ci', '--format', 'simple'])).argv

		handler(args);

		setTimeout(() => {
			expect(writeFileSync).to.have.been.called;
			expect(writeFileSync).to.have.been.calledWith(sinon.match.string, 'a=z\nb=y\n');
			done();
		}, 0);
	});

	it('uses team name if passed', (done) => {
		const fetch = sinon.stub();
		const writeFileSync = sinon.spy();
		process.env.CIRCLECI = 1;
		fetch.withArgs('https://vault.in.ft.com/v1/auth/approle/login', sinon.match.object).returns(Promise.resolve({ auth: { client_token: 'mytoken' }}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/myteam/myapp/continuous-integration', sinon.match.object).returns(Promise.resolve({ data: { env: { a: 'z' }}}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/myteam/myapp/shared', sinon.match.object).returns(Promise.resolve({ data: {}}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/myteam/shared/continuous-integration', sinon.match.object).returns(Promise.resolve({ data: { b: 'y' }}));

		const {builder, handler} = proxyquire('../scripts/commands/get-config', {
			'@financial-times/n-fetch': fetch,
			'fs': { writeFileSync }
		});

		const args = builder(yargs(['', '', '--app', 'myapp','--team', 'myteam', '--env', 'ci', '--format', 'simple'])).argv;

		handler(args);

		setTimeout(() => {
			expect(writeFileSync).to.have.been.called;
			expect(writeFileSync).to.have.been.calledWith(sinon.match.string, 'a=z\nb=y\n');
			done();
		}, 0);
	});

	it('fetches session tokens when needed', (done) => {
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
		fetch.withArgs('http://test-sessions-url/premium?api_key=test_api_key').returns(Promise.resolve({ FTSession: 'p-token', FTSession_s: 'p-token_s' }));
		fetch.withArgs('http://test-sessions-url/standard?api_key=test_api_key').returns(Promise.resolve({ FTSession: 's-token', FTSession_s: 's-token_s' }));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/development', { headers: { 'X-Vault-Token': 'my-token' }}).returns(Promise.resolve({ data: { TEST_SESSIONS_URL: 'http://test-sessions-url', TEST_SESSIONS_API_KEY: 'test_api_key', TEST_USER_TYPES: 'premium,standard' }}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/myapp/shared', { headers: { 'X-Vault-Token': 'my-token' }}).returns(Promise.resolve({ data: { env: [ 'b' ]}}));
		fetch.withArgs('https://vault.in.ft.com/v1/secret/teams/next/shared/development', { headers: { 'X-Vault-Token': 'my-token' }}).returns(Promise.resolve({ data: { TEST_SESSIONS_URL: 'http://test-sessions-url', TEST_SESSIONS_API_KEY: 'test_api_key', TEST_USER_TYPES: 'premium,standard' }}));
		const appendSessionTokens = proxyquire('../scripts/append-session-tokens', {
			'@financial-times/n-fetch': fetch
		});

		const {builder, handler} = proxyquire('../scripts/commands/get-config', {
			'@financial-times/n-fetch': fetch,
			'fs': { readFile, writeFileSync },
			'os': { homedir },
			'../append-session-tokens': appendSessionTokens
		})

		const args = builder(yargs(['', '', '--app', 'myapp', '--env', 'dev', '--format', 'simple'])).argv;

		handler(args);

		setTimeout(() => {
			expect(writeFileSync).to.have.been.called;
			expect(writeFileSync).to.have.been.calledWith(sinon.match.string,
				'PREMIUM_FTSession=p-token\n' +
				'PREMIUM_FTSession_s=p-token_s\n' +
				'STANDARD_FTSession=s-token\n' +
				'STANDARD_FTSession_s=s-token_s\n' +
				'TEST_SESSIONS_API_KEY=test_api_key\n' +
				'TEST_SESSIONS_URL=http://test-sessions-url\n' +
				'TEST_USER_TYPES=premium,standard\n');
			done();
		}, 0);
	});
});
