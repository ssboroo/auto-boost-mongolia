# Meta / Windsor integration

## Одоогийн flow
1. Frontend `/facebook` дэлгэц backend-ийн `/meta/status` endpoint-ийг шалгана.
2. `Facebook Ads холбох` дарахад `/meta/connect-info`-оос Windsor temporary OAuth connect URL авна.
3. Хэрэглэгч Meta OAuth зөвшөөрөл өгнө.
4. `/meta/accounts` connected ad account-уудыг reporting data-аас ялган жагсаана.
5. `/meta/actions` тухайн үед Windsor дээр байгаа Facebook write action-ууд болон JSON schema-г live авна.
6. Publish хийх үед UI schema-д тохирсон params бэлдэж `/meta/actions/execute` руу явуулна.
7. Campaign/ad set/ad creation action-уудын дараа user confirmation flow ашиглана.

## Security
- Windsor API key зөвхөн backend environment variable байна.
- Temporary connect URL-г database болон log-д хадгалахгүй.
- Frontend Windsor API key-г хэзээ ч авахгүй.
- Live write action хийхийн өмнө хэрэглэгчид яг ямар өөрчлөлт хийхийг харуулж баталгаажуулна.

## Дараагийн integration
Facebook Ads connector paid advertising assets-д зориулагдсан. Existing organic post сонгох UX-д Page/post source-ийг тусдаа холбоно. Сонгосон post ID-г Windsor-ийн supported boost action schema руу дамжуулна.
