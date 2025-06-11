import { BankrunProvider, startAnchor } from 'anchor-bankrun'
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Voting } from '../target/types/voting'
import { expect } from 'chai'
import { before } from 'mocha'
const IDL = require('../target/idl/voting.json')

const votingAddress = new PublicKey('6ULJMLqNE4aB4iKazgsfmTPtdRMniC5BXf18xS3LWHFs')

describe('Voting', () => {
  // // Configure the client to use the local cluster.

  let provider: BankrunProvider
  let votingProgram: Program<Voting>

  before(async () => {
    const context = await startAnchor(
      '', // Path to your program directory
      [{ name: 'voting', programId: votingAddress }],
      [],
    )
    provider = new BankrunProvider(context)
    votingProgram = new Program<Voting>(IDL, provider)
  })

  it('Initialize poll', async () => {
    // Add your test here.
    const tx = await votingProgram.methods
      .initializePoll(new anchor.BN(1), new anchor.BN(0), new anchor.BN(1759508293), 'test-poll', 'description')
      .rpc()

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('poll'), new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress,
    )

    const poll = await votingProgram.account.pollAccount.fetch(pollAddress)

    console.log('poll:', poll)

    expect(poll.pollId.toNumber()).equal(1)
    expect(poll.pollName.toString()).equal('test-poll')
    expect(poll.pollDescription.toString()).equal('description')
    expect(poll.pollVotingStart.toNumber()).lessThan(poll.pollVotingEnd.toNumber())
  })

  it('Initialize candidate', async () => {
    // Add your test here.
    await votingProgram.methods.initializeCandidate(new anchor.BN(1), 'Rodriquez').rpc()
    await votingProgram.methods.initializeCandidate(new anchor.BN(1), 'Luiz').rpc()

    const [rodriquezAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Rodriquez')],
      votingAddress,
    )

    const rodriquez = await votingProgram.account.candidateAccount.fetch(rodriquezAddress)

    console.log('rodriquez:', rodriquez)

    expect(rodriquez.candidateName.toString()).equal('Rodriquez')
    expect(rodriquez.candidateVotes.toNumber()).equal(0)
  })
})
