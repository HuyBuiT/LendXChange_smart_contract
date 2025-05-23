import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import {
  RPC_URL,
  VERSION,
  OPERATOR_PRIVATE_KEY,
  UPGRADED_PACKAGE,
  LEND_COIN_TYPE,
  OPERATOR_CAP,
  HOT_WALLET_ADDRESS,
  LENDER_FEE_PERCENT,
  BORROWER_FEE_PERCENT,
  MAX_OFFER_INTEREST,
  MIN_HEALTH_RATIO,
  MAX_PRICE_AGE_SECONDS,
} from "./environment.js";
import { getSignerByPrivateKey } from "./common.js";

const initSystem = async () => {
  const suiClient = new SuiClient({ url: RPC_URL });
  const signer = getSignerByPrivateKey(OPERATOR_PRIVATE_KEY);
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${UPGRADED_PACKAGE}::operator::init_system`,
    typeArguments: [LEND_COIN_TYPE],
    arguments: [
      tx.object(OPERATOR_CAP),
      tx.object(VERSION),
      tx.pure.u64(LENDER_FEE_PERCENT),
      tx.pure.u64(BORROWER_FEE_PERCENT),
      tx.pure.u64(MAX_OFFER_INTEREST),
      tx.pure.u64(MIN_HEALTH_RATIO),
      tx.pure.address(HOT_WALLET_ADDRESS),
      tx.pure.u64(MAX_PRICE_AGE_SECONDS),
    ],
  });

  const res = await suiClient.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer,
  });

  console.log({ response: res }, "Init system");
};

initSystem();
