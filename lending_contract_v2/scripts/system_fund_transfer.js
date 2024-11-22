import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import {
  RPC_URL,
  VERSION,
  OPERATOR_PRIVATE_KEY,
  UPGRADED_PACKAGE,
  LEND_COIN_TYPE,
  OPERATOR_CAP,
  STATE,
  SUI_COLLATERAL_COIN_TYPE,
} from "./environment.js";
import { getSignerByPrivateKey } from "./common.js";

const systemFundTransfer = async (loanOfferId, lendAmount) => {
  const suiClient = new SuiClient({ url: RPC_URL });
  const signer = getSignerByPrivateKey(OPERATOR_PRIVATE_KEY);
  const tx = new TransactionBlock();
  const [lendCoin] = await splitCoin(
    suiClient,
    tx,
    signer.getPublicKey().toSuiAddress(),
    LEND_COIN_TYPE,
    [lendAmount]
  );
  tx.moveCall({
    target: `${UPGRADED_PACKAGE}::operator::system_fund_transfer`,
    typeArguments: [LEND_COIN_TYPE, SUI_COLLATERAL_COIN_TYPE],
    arguments: [
      tx.object(OPERATOR_CAP),
      tx.object(VERSION),
      tx.object(STATE),
      tx.pure.id(loanOfferId),
      lendCoin,
    ],
  });

  const res = await suiClient.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer,
  });

  console.log(
    { response: res },
    `System fund transfer offer ${loanOfferId}: amount(${lendAmount})`
  );
};

const splitCoin = async (suiClient, tx, walletAddress, coinType, amounts) => {
  const balance = await suiClient.getBalance({
    owner: walletAddress,
    coinType,
  });
  const totalAmount = amounts.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
  if (BigInt(balance.totalBalance) < totalAmount) {
    throw new Error(
      `Not enough balance coin type ${coinType} to split from ${walletAddress}`
    );
  }
  const coinToSplit = await getCoinToSplit(
    suiClient,
    tx,
    walletAddress,
    totalAmount,
    coinType
  );
  const serializedAmounts = amounts.map((amount) => tx.pure.u64(amount));
  const coinsSplitted = tx.splitCoins(coinToSplit, serializedAmounts);
  return coinsSplitted;
};

const getCoinToSplit = async (
  suiClient,
  tx,
  walletAddress,
  amount,
  coinType
) => {
  const coins = [];
  let cursor = null;
  while (true) {
    const paginatedCoins = await suiClient.getAllCoins({
      owner: walletAddress,
      cursor,
    });
    cursor = !paginatedCoins.nextCursor ? paginatedCoins.nextCursor : null;

    for (const coin of paginatedCoins.data) {
      if (coin.coinType === coinType && Number(coin.balance) > amount) {
        return coin.coinObjectId;
      } else if (coin.coinType === coinType) {
        coins.push(coin);
      }
    }
    if (!paginatedCoins.hasNextPage) break;
    await wait(100);
  }
  return await mergeAllCoin(coins, tx);
};

const mergeAllCoin = async (coins, tx) => {
  if (coins.length == 0) {
    console.log("No coins to merge");
    throw new Error("No coins to merge");
  } else if (coins.length == 1) {
    console.log("Only one coin to merge");
    return coins[0].coinObjectId;
  }
  const coinsFiltered = coins.map((coin) => coin.coinObjectId);
  const [destinationCoin, ...restCoin] = coinsFiltered;
  tx.mergeCoins(destinationCoin, restCoin);
  return destinationCoin;
};

const main = async (loanOfferId, lendAmount) => {
  try {
    console.log("start system fund transfer");
    await systemFundTransfer(loanOfferId, lendAmount);
  } catch (e) {
    console.error(e);
    console.log(`Error to cancel offer ${loanOfferId}`);
  }
};

main("", 100000000);
