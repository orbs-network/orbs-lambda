const child_process = require("child_process");
const {expect} = require("chai");
const {parseExpression} = require("cron-parser");
const {utils} = require("web3")

class Engine {
    onCron(fn, args) {
        describe("onCron", ()=> {
            it("onCron params", ()=> {
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
        describe("onInterval", ()=> {
            it("onInterval params", () => {
                expect(fn).to.be.a('function');
                expect(args).to.include.all.keys("interval");
                expect(args.interval).to.match(/(\d+) ?([mhd])/i);
            })
        })
    }

    onEvent(fn, args) {
        describe("onEvent", ()=> {
            it("onEvent params", () => {
                expect(fn).to.be.a('function');
                expect(args).to.include.all.keys("network", "contractAddress", "abi", "eventName");
                expect(['ethereum', 'polygon', 'bsc', 'avalanche', 'fantom'], `Unsupported network ${args.network}`).to.include(args.network);
                expect(args.abi).to.be.an('array');
                utils.toChecksumAddress(args.contractAddress);
                expect(args.eventName).to.be.a('string');
            })
        })
    }

    // onBlocks(fn, args) {
    //     expect(fn).to.be.a('function');
    //     expect(args).to.include.all.keys("network")
    // }
}

const engine = new Engine();

describe("Schema test", () => {
    it("should successfully run handlers", () => {
        // const schema = require("./index");
        // expect(schema).to.include.keys('register')
        // schema.register(engine);

        let changedFiles = child_process.execSync('git diff-tree --no-commit-id --name-only -r HEAD').toString().trim().split('\n');
        for (const file of changedFiles) {
            if (/projects\/.*\/index.js/.test(file)) {
                console.log(file)
                const schema = require(file)
                expect(schema).to.include.keys('register')
                schema.register(engine);
            }
        }
    })
})




