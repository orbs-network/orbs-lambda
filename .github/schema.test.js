const {execSync} = require("child_process");
const {expect} = require("chai");
const {parseExpression} = require("cron-parser");
const {utils} = require("web3");
const {join} = require('path');

class Engine {
    onCron(fn, args) {
        describe("onCron", ()=> {
            it("onCron params", () => {
                expect(fn).to.be.a('function');
                expect(args).to.include.all.keys("cron");
                try {
                    parseExpression(args.cron);
                } catch (e) {
                    throw new Error(`Error parsing cron expression: ${e}`)
                }
            })
        })
    }

    onInterval(fn, args) {
        describe("onInterval", () => {
            it("onInterval params", () => {
                expect(fn).to.be.a('function');
                expect(args).to.include.all.keys("interval");
                expect(args.interval).to.match(/(\d+) ?([mhd])/i);
            })
        })
    }

    onEvent(fn, args) {
        describe("onEvent", () => {
            it("onEvent params", () => {
                expect(fn).to.be.a('function');
                expect(args).to.include.all.keys("network", "contractAddress", "abi", "eventName");
                expect(['ethereum', 'polygon', 'bsc', 'avalanche', 'fantom']).to.include(args.network);
                expect(args.abi).to.be.an('array');
                utils.toChecksumAddress(args.contractAddress);
                expect(args.eventName).to.be.a('string');
            })
        })
    }

    onBlocks(fn, args) {
        describe("onBlocks", () => {
            it("onBlocks params", () => {
                expect(fn).to.be.a('function');
                expect(args).to.include.all.keys("network");
                expect(['ethereum', 'polygon', 'bsc', 'avalanche', 'fantom']).to.include(args.network);
            })
        })
    }
}

const engine = new Engine();

describe("Schema test", () => {
    it("should successfully run handlers", () => {
        let changedFiles = execSync('git diff-tree --no-commit-id --name-only -r HEAD').toString().trim().split('\n');
        console.log(changedFiles)
        for (const file of changedFiles) {
            if (/projects\/.*\/index.js/.test(file)) {
                console.log(file)
                const schema = require(join(process.cwd(), file))
                expect(schema).to.include.keys('register')
                schema.register(engine);
            }
        }
    })
})




