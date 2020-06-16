//Ref: https://gist.github.com/santacruz123/3623310
//
export function GetSchole(lastItem) {
  var tempObject = lastItem;
  var pArr = [];
  tempObject.optionPriceAtPurchase =
    BlackScholes(
      tempObject.type,
      tempObject.stockPrice,
      tempObject.strikePrice,
      tempObject.expiration / 365, //needs to be in years
      tempObject.interestFree, //this will be in decimal format
      tempObject.volatility / 100 //divide by 100 to get percent
    ) * 100;
  for (let index = 0; index < tempObject.expiration; index++) {
    pArr.push(GetCalcArr(tempObject, index));
  }
  tempObject.priceArray = pArr;
  return tempObject;
}

export function GetBreakEvens(checksList) {
  // for (let i = 0; i < checksList.length; i++) {
  //   let exp = checksList[i].expiration;
  //   while (exp !== 0) {
  //     checksList[i].breakEvens.push(
  //       checksList[i].optionPriceAtPurchase -
  //         BlackScholes(
  //           checksList[i].type,
  //           checksList[i].stockPrice,
  //           checksList[i].strikePrice,
  //           exp / 365, //needs to be in years
  //           checksList[i].interestFree, //this will be in decimal format
  //           checksList[i].volatility / 100 //divide by 100 to get percent
  //         ) *
  //           100
  //     );
  //     exp--;
  //   }
  // }
}

export function CalcBScholes(checksList) {
  var finalCalcs = [];

  if (checksList.length > 0) {
    var stockPrice = Number(checksList[0].stockPrice); //get starting price

    //cancel if exp > 150
      for (let checkExp = 0; checkExp < checksList.length; checkExp++) {
        if (checksList[checkExp].expiration > 150) return [];
      }

    let multiplier = Math.floor(stockPrice / 12); //tweak graph size here
    for (
      let index = stockPrice - multiplier;
      index < stockPrice + multiplier;
      index += 0.5 //this will change resolution of graph. the higher the number the less ticks
    ) {
      var entryAtStockPrice = {};
      entryAtStockPrice["x"] = index; //add stock price on x axis
      for (let i = 0; i < checksList.length; i++) {
        //var entryAtStockPrice = {};

        //add price at purchase. replace with API data
        if (checksList.optionPriceAtPurchase === undefined) {
          checksList[i].optionPriceAtPurchase =
            BlackScholes(
              checksList[i].type,
              checksList[i].stockPrice,
              checksList[i].strikePrice,
              checksList[i].expiration / 365, //needs to be in years
              checksList[i].interestFree, //this will be in decimal format
              checksList[i].volatility / 100 //divide by 100 to get percent
            ) * 100;
          //Sell contracts are neg
          if (checksList[i].buySell === "sell")
            checksList[i].optionPriceAtPurchase *= -1;
        }

        for (let j = 0; j <= checksList[i].expiration; j++) {
          //iterate through expirations

          var type = checksList[i].type;
          var strikeX = Number(checksList[i].strikePrice);
          var timeYears = (checksList[i].expiration - j) / 365;
          var r = checksList[i].interestFree;
          var volatility = checksList[i].volatility / 100;
          var BS =
            BlackScholes(type, index, strikeX, timeYears, r, volatility) * 100; //current price
          var sign = checksList[i].buySell === "sell" ? -1 : 1;
          if (entryAtStockPrice["DAY" + (j + 1)] === undefined)
            entryAtStockPrice["DAY" + (j + 1)] = 0;
          if (isNaN(BS)) BS = 0;
          var tempEnt = entryAtStockPrice["DAY" + (j + 1)];
          entryAtStockPrice["DAY" + (j + 1)] =
            Number.parseFloat(checksList[i].numberOfContracts) *
              (sign * BS - checksList[i].optionPriceAtPurchase) +
            tempEnt;
        }
      }
      finalCalcs.push(entryAtStockPrice);
    }
    return finalCalcs;
  } else return [];
}
function GetCalcArr(lastItem, i) {
  var type = lastItem.type;
  var stockPrice = Number(lastItem.stockPrice);
  var strikeX = Number(lastItem.strikePrice);
  var timeYears = (lastItem.expiration - i) / 365;
  var r = lastItem.interestFree;
  var volatility = lastItem.volatility / 100;

  var pArr = [];
  let multiplier = Math.floor(stockPrice / (6 * (1 / volatility))); //tweak graph size here
  for (
    let index = stockPrice - multiplier;
    index < stockPrice + multiplier;
    index += (multiplier * 2) / stockPrice //this will change resolution of graph. the higher the number the less ticks
  ) {
    var BS = BlackScholes(type, index, strikeX, timeYears, r, volatility) * 100;
    if (lastItem.buySell === "buy") {
      pArr.push({
        oPrice: 1 * BS - lastItem.optionPriceAtPurchase, //If buy
        sPrice: index,
      });
    } else {
      pArr.push({
        oPrice: -1 * BS + lastItem.optionPriceAtPurchase, //If sell
        sPrice: index,
      });
    }
  }

  return pArr;
}

function BlackScholes(PutCallFlag, S, X, T, r, v) {
  var d1 = (Math.log(S / X) + (r + (v * v) / 2) * T) / (v * Math.sqrt(T));
  var d2 = d1 - v * Math.sqrt(T);
  if (PutCallFlag === "call") {
    return S * CND(d1) - X * Math.exp(-r * T) * CND(d2);
  } else {
    return X * Math.exp(-r * T) * CND(-d2) - S * CND(-d1);
  }
}

/* The cummulative Normal distribution function: */
function CND(x) {
  if (x < 0) {
    return 1 - CND(-x);
  } else {
    var k = 1 / (1 + 0.2316419 * x);
    return (
      1 -
      (Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI)) *
        k *
        (0.31938153 +
          k *
            (-0.356563782 +
              k * (1.781477937 + k * (-1.821255978 + k * 1.330274429))))
    );
  }
}
