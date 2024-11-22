import {
    HOT_WALLET_ADDRESS,
    OPERATOR_PRIVATE_KEY,
    LEND_COIN_TYPE,
    OPERATOR_CAP,
    VERSION,
    STATE,
    PACKAGE,
    RPC_URL,
  } from "./environment.js";
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getSignerByPrivateKey } from "./common.js";

const cancelOfferTransaction = async (offerId, amount) => {
    const suiClient = new SuiClient({ url: RPC_URL });
    const usdcCoins = await suiClient.getCoins({
        owner: HOT_WALLET_ADDRESS,
        coinType: LEND_COIN_TYPE,
      });
      const tx = new TransactionBlock();
      const coins = usdcCoins.data;
      if (coins.length >= 2) {
        // Merge all coins into the first coin
        const primaryCoin = coins[0].coinObjectId;
        const secondaryCoins = coins.slice(1).map((coin) => coin.coinObjectId);
  
        for (const coin of secondaryCoins) {
          tx.mergeCoins(primaryCoin, [coin]);
        }
      }
  
      const [lendCoin, waitingInterest] = tx.splitCoins(coins[0].coinObjectId, [
        tx.pure(amount),
        tx.pure(0),
      ]);
      const moduleId = 'operator';
      const functionId = 'system_cancel_offer';
      const gasBudget = 10000000;
      const signer = getSignerByPrivateKey(OPERATOR_PRIVATE_KEY);

      tx.moveCall({
        typeArguments: [LEND_COIN_TYPE],
        arguments: [
          tx.object(OPERATOR_CAP),
          tx.object(VERSION),
          tx.object(STATE),
          tx.pure(offerId),
          lendCoin,
          waitingInterest,
        ],
        target: `${PACKAGE}::${moduleId}::${functionId}`,
      });
      tx.setGasBudget(gasBudget);
      try {
        const response = await suiClient.signAndExecuteTransactionBlock({
          signer: signer,
          transactionBlock: tx,
          options: {
            showEffects: true,
            showInput: true,
          },
        });

        console.log('res', response)
      } catch (error) {
        console.error('Error executing transaction:', error);
      }
}

cancelOfferTransaction('0xb3151813835f5904eb61a78c6a9fdc3304e437acf83b5369bdfdae415431b068', 100000000)