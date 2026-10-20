// @ts-check
import { defineProject } from '@orbs-network/lambda';

export default defineProject({
  tasks: {
    inspect: {
      trigger: { onRpc: {} },
      handler: (ctx) => ({
        version: 2,
        project: ctx.project,
        release: ctx.release,
        leader: ctx.isLeader,
        query: ctx.firing.payload.query,
      }),
    },
    heartbeat: {
      trigger: { onInterval: '1m' },
      handler: async (ctx) => {
        ctx.log.info('hello from orbs-lambda', { firing: ctx.firing.id, rank: ctx.firing.rank, committee: ctx.committee.length });
      },
    },
    bscHead: {
      network: 'bsc',
      trigger: { onCron: '*/5 * * * *' },
      handler: async (ctx) => {
        const block = await ctx.client().getBlockNumber();
        ctx.log.info('bsc head', { block });
      },
    },
  },
});
