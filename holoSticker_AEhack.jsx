// holoSticker_AEhack.jsx
// 指示書.txt の手順1〜8を実装したAE用ホログラムステッカースクリプト
//
// 手順1: 既存コンポジション内に新規コンポジション "holoSticker_001" を作成し、レイヤーとして
//        配置する。サイズは幅・高さをUIで個別に指定(正方形推奨だが非正方形も可、既定1080x1080)。
//        フレームレート・秒数はアクティブなコンポジションに依存する。
//        アクティブなコンポが無ければエラー終了。
// 手順2: holoSticker_001内に、1辺が holoSticker_001 の「縦(Y)の値」の10分の1の正方形
//        コンポジション "tile_001" を作成する(holoSticker_001が非正方形でもtile_001は
//        常に正方形、基準は高さ)。新規平面2枚(下=ブライトネス60%グレー、上=ブライトネス50%
//        ニュートラルグレー)。tile_001はholoSticker_001内にレイヤーとして配置し非表示にする。
//        生成した全アイテムは実行の最後にholoSticker_001名義のProjectフォルダへ整理する。
//        フォルダ構成(ユーザー要望で変更): holoSticker_001フォルダの直下にはメインコンポ
//        holoSticker_001自身だけを置き、それ以外(tile_001, noise_001, 各種solid等)は
//        同フォルダ内のSource_001サブフォルダにまとめる。
// 手順3: 上のレイヤー(Neutral Gray 50%)にブロックディゾルブ。Soft Edgesオフ、
//        Block Width/Height=コンポの半分、Feather=10。Transition Completionは指示書に
//        数値指定が無いため、2x2のタイル状に見える値として40を採用(実機レンダーで確認)。
// 手順4: tile_001最上部に黒の新規平面→ノイズ(Amount100, カラーノイズオフ)→プリコンポーズ
//        (新規コンポ"noise_001")→フレーム固定(freeze frame)。noise_001に放射状ブラー
//        (Amount50)→描画モードをスクリーンに。
// 手順5: tile_001最上部に黒の新規平面→CC Light Sweep(Center=中央、Direction=45、
//        Sweep Intensity=50、Edge Thickness=0)→描画モード=加算。
// 手順6: Light Sweepの色収差でホログラムを作る。指示書は「レイヤースタイル>高度な合成>
//        R/G/Bのみオン」(手動操作)だが、これをapp.executeCommand()のメニューコマンド経由で
//        アンロックする実装はAE本体をクラッシュさせた実績があるため([[adobe-scripting-via-osascript]]
//        参照、以前の類似プロジェクトで実機確認済みの既知の危険な罠)、同じ視覚効果を安全な
//        "Shift Channels" エフェクトで代替する。Lightレイヤーを"R"にリネームしRのみ通す→
//        複製して"G"(Direction70/Width60)→複製して"B"(Direction25/Width80)。さらに
//        "Rotation"ヌルを作り、各レイヤーのDirectionに
//        `value + thisComp.layer("Rotation").transform.rotation` を設定。
// 手順7: R/G/B全レイヤーに放射状ブラー(Amount=50)。
// 手順8: holoSticker_001に新規平面"Tiles"を作りParticle Playground(matchName "ADBE Playgnd")
//        をかけてtile_001を敷き詰める。Cannon不使用(PPS=0, Radius=0)、Gravity Force=0。
//        Particles Across/Downは指示書の指定通り固定値ではなく「tile_001の大きさを計算して」
//        コンポサイズ÷tile_001の実寸で算出する(holoSticker_001が非正方形でも縦横それぞれ
//        隙間なく敷き詰められる)。
//        [罠、実機で発見・修正]: 当初はGrid Width/Height=コンポサイズそのまま、
//        Particles Across/Down=Math.roundで算出していたが、コンポサイズとタイル数の
//        組み合わせによっては割り切れず、Grid幅÷Particles数がタイル実寸と完全には一致せず
//        隙間や重なりが出ることがあった(ユーザー報告で発覚)。修正: Particles Across/Downは
//        Math.ceil(切り上げ、コンポ全体を隙間なく覆うことを優先)で求め、Grid Width/Heightは
//        コンポサイズではなく「タイル実寸×個数」の整数倍にする。これでGrid幅÷Particles数が
//        常にタイル実寸と完全一致し、どんな組み合わせでも隙間が出ない(敷き詰めた範囲が
//        コンポの外に少しはみ出ることがあるが、コンポの外なので見た目には影響しない)。
//        Grid Particle Radiusをt=0(既定値)→1フレーム後に0のキーフレームにして最初の1回だけ
//        発生させる。Layer Map > Use Layer に(既に非表示で配置済みの)tile_001レイヤーを指定。
// 手順9: holoSticker_001の回転とtile_001内Rotationヌルの回転を連動させる。既存コンポ内に
//        配置されているholoSticker_001レイヤーを3Dレイヤーにし、tile_001内Rotationヌルの
//        回転に `RX = xRotation*6, RY = yRotation*6, RZ = zRotation*6` を取得する式を書く。
//        3つの合算方法は指示書に明記が無いため、RX+RY+RZ(合計)を採用(以前の類似プロジェクトと
//        同じ仮定)。tile_001はholoSticker_001の中に、holoSticker_001は既存(アクティブ)
//        コンポの中にネストされている2重ネスト構造のため、`thisComp`では外側のholoSticker_001
//        レイヤーに届かない。`comp("<既存コンポ名>").layer("<holoSticker_001のレイヤー名>")`
//        というグローバル参照でネストの階層を無視して直接参照する。
//        [罠、実機で発見・修正]: ビューポートの回転ツール(特にフリー回転の外側リング)は
//        Orientationプロパティのみを動かし、X/Y/Z Rotationプロパティは0のまま変化しない
//        (手順11のカメラPosition/POIと同種の罠、複数個作成後にユーザーが実際にツールで
//        回転させたところ全く反応しないことで発覚)。修正: X/Y/Z Rotationに加え
//        sticker.transform.orientationの各軸成分も加算するようにし、どちらの操作方法でも
//        反応するようにした。
// 手順10: holoSticker_001レイヤーに エフェクト>制御>角度コントロール("Manual Rotation"に
//        リネーム)を追加し、tile_001内Rotationヌルの回転式に手動角度も加算する
//        (RX+RY+RZ+manual)。これでヌルの回転で全lightSweepを制御できる自動シマーに加えて、
//        角度コントロールのスライダーで手動オフセットも足せるようになる。
// 手順11: 既存(アクティブ)コンポにアクティブカメラがある場合、そのカメラの動きもtile_001内
//        Rotationヌルに反映させる。カメラの有無・切り替えに動的に追従できるよう、
//        エクスプレッション内で `comp("<既存コンポ名>").activeCamera` を毎フレーム評価する。
//        [重要な罠、実機で発見・修正]: 当初はcam.transform.xRotation/yRotationを直接
//        読んでいたが、AEの既定カメラ(Point of Interestあり)はオービット操作(視点を回す
//        一般的な操作)だとPositionだけが動きRotationプロパティは0のままになるため、
//        「カメラを動かしてもLightSweepが反応しない」というユーザー報告の不具合になった。
//        修正: カメラの視線ベクトル(ローカルZ軸)をsticker.fromWorldVec(cam.toWorldVec(...))
//        でstickerのローカル座標に変換し、atan2で相対角度を算出する方式に変更。
//        Position操作・Rotation操作どちらのカメラの動かし方でも正しく追従する。
//        ロール(バンク)のみZ RotationプロパティがTwo-Nodeカメラでも機能するためそのまま使用。
//        係数(×6)は指示書に明記が無いため、sticker本体と同じ値を踏襲(指示書に明記の無い仮定)。
//        [2つ目の罠、実機で発見・修正]: カメラレイヤーが1つも無くても
//        thisComp.activeCameraは常にtruthyな「Default」という名前の暗黙カメラを返し、
//        nullにならない。そのため`if (cam)`だけでは「本物のカメラが存在するか」を判定できず、
//        カメラ無し状態でもCX/CY/CZが誤って加算されるバグがあった(sticker回転のみの
//        テストで210になるはずが21.4になる形で発覚)。修正: hostコンポの実レイヤーと
//        activeCameraが同一オブジェクトかどうかを照合し、本物のカメラレイヤーが実在する
//        場合のみCX/CY/CZを計算するように変更。
//        [3つ目の罠、実機で発見・修正]: カメラの視線ベクトルをsticker.fromWorldVec(...)で
//        sticker自身のローカル座標に変換していたため、その角度の中にsticker自身の現在の
//        回転量がすでに織り込まれてしまい、RX/RY/RZ(sticker自身の回転)と二重にカウント
//        されて正負が打ち消し合っていた(sticker回転とカメラを同時に使うと、sticker回転側の
//        連動が丸ごと効かなくなるユーザー報告の不具合。実機でRX=120,CX=-120と正確に相殺
//        することを確認)。修正: sticker.fromWorldVec()を使わず、cam.toWorldVec()の結果を
//        そのままhost(=sticker自身の回転の影響を受けない固定基準)の座標系として使うように
//        変更。sticker自身の回転とカメラの動きを二重カウントせず独立して加算できる。
//
// バグ修正(コードレビュー指摘分):
// ①noise_001プリコンポーズ後のレイヤー特定を、名前文字列の再検索(findLayerByName)から
//   precompose()が返すnewComp参照との一致比較に変更。実機で「同一プロジェクト内で
//   パイプラインを2回連続実行」を検証したところ、AEは項目名の重複を許し
//   precomposeも自動リネームしないため実際にはクラッシュは再現しなかったが
//   (2つの"noise_001"という名前のコンポが共存するだけ)、名前ベースの検索は本質的に
//   脆弱なため、より頑健な参照ベースの実装に修正した。
// ②アクティブコンポの取得をモジュール読み込み時の一度きり(INITIAL_ACTIVE_COMP)から、
//   「作成」ボタンクリック時点での再取得に変更。ダイアログモードでは無害だが、
//   パネルとして常駐させて使う場合、パネルを開いたままアクティブコンポを切り替えて
//   から「作成」を押すと、切り替え前の古いコンポに配置してしまうバグだった。
//   createHoloStickerComp/linkHoloRotationToTileにhostComp/hostCompNameを引数で渡す形に
//   リファクタリングし、$.global.HOLO_NO_UIテスト分岐も同様に統一した。
//
// 複数作成対応: 「作成」を押すとダイアログは閉じる(1回の起動=1個作成)。もう1個
// 作りたい場合はスクリプトを再度起動する。uniqueCompNameが自動で連番
// (holoSticker_001, _002, _003 ...)を振るため、同じプロジェクト内で何度起動しても
// 名前が衝突することはない。
//
// バグ修正(「複数個めの回転が連動しない」): 当初はcomp.openInViewer()で新規holoSticker自身を
// プレビュー表示していたが、これがactiveItemを新規holoStickerに切り替えてしまう副作用があり、
// 「もう1個作りたい時はスクリプトを再度起動する」という運用だと、2回目の実行時に
// activeComp(=作成時に自動取得するアクティブコンポ)として前回作ったholoSticker_001自体が
// 拾われてしまい、2個目がholoSticker_001の中にネストされて配置される(=ユーザーが実際に
// 回転させている本来のコンポの中には無いので、回転に連動しないように見える)バグがあった。
// 実機で再現・特定済み。修正: 新規コンポを開く代わりにactiveComp.openInViewer()で元の
// ホストコンポをアクティブなままにし、何度スクリプトを再起動しても常に同じホストコンポに
// 追加されるようにした。
//
// タイル数のUI化: tile_001の1辺=holoSticker_001の高さ/10だった固定値を、UIで指定できる
// 「タイルの数(縦方向、1辺あたり)」に変更。横はこの値と実寸から自動計算される。
// Particle Playgroundの格子(Particles Across/Down)は元々tile_001の実寸(コンポ幅・高さ÷
// tile_001の実際のピクセルサイズ)から動的に算出する設計だったため、タイル数を変更しても
// 自動的に連動し、常に隙間なく敷き詰められる。
//
// 設定の記憶をやめた: 当初は幅・高さをapp.settingsに保存し前回値を復元していたが、
// 「初めてでも複数回でも常にデフォルトの1080x1080にしてほしい」との要望により廃止した。
// タイルの数と合わせて、幅・高さ・タイルの数のいずれも前回値を記憶せず、何度起動しても
// 常に既定値(1080x1080, タイル数10)から始まる。
//
// バグ修正(「レイヤー削除→再追加でエクスプレッションが連動しなくなる」): AEはエクスプレッションが
// 未処理の例外を投げると、そのプロパティを自動的に"Expression Disabled"状態にし、原因が
// 解消されても自動では復活しない。sticker/tile_001をタイムラインから削除→再度Projectパネルから
// タイムラインに入れる、という操作で実機再現(削除時に「layer named 'holoSticker_001' is
// missing」で無効化→再追加しても無効化されたまま)。修正: comp("host").layer(name)による
// sticker/カメラへのアクセスをtry/catchで包み、レイヤーが見つからない間は安全に寄与0として
// 扱うようにした。未処理エラーが発生しなくなるためエクスプレッションは常に有効なままになり、
// レイヤーが戻れば次のフレームで自動的に連動が復活する(手動での再有効化が不要になった)。
//
// 「再リンク」「削除」「監視に追加」ボタンは一度UIに追加したが、ユーザーの判断で削除した
// (「作成」時の自動監視だけで日常運用としては十分なため)。内部関数(findCurrentPlacement,
// deleteHoloStickerAndFolder等)は自動監視機能が引き続き使用するため残してある。
//
// 自動監視機能: 「タイムラインからネイティブのDeleteキーで消したら自動でフォルダも消えて
// ほしい」という要望に対し、app.scheduleTask(文字列, 間隔ms, repeat=true)を使った
// ポーリング監視を実装した。実機で以下を確認済み:
//   ・repeat=trueで実際に繰り返し実行され、app.cancelTask(id)で停止できる
//   ・スケジュールされたタスクの中からconfirm()を呼んでも、本物のインタラクティブな
//     ダイアログとして正しく表示・ブロックされる(ユーザーと一緒に実機確認済み)
// 「作成」時に自動でこの監視対象に登録される。監視ループは2秒間隔でポーリングし、
// 追跡中のholoStickerがどのコンポにもレイヤーとして存在しなくなったこと
// (=タイムラインから削除されたこと)を検知すると、confirm()でユーザーに確認した上で
// Project内の関連アイテム・フォルダを削除する。
// $.globalはAEセッション全体で共有されるため、監視リストとタスクIDを$.globalに保持し、
// スクリプトを何度再実行しても監視ループが重複起動しないようにしている。
// 注意点: (1) 真のイベントフックではなくポーリングのため最大2秒程度の検知遅延がある、
// (2) app.scheduleTaskによる監視はAEセッション内でのみ有効で、AEを再起動すると
// 監視は解除される(再開するにはholoSticker_AEhackで新規に1個作成すれば、それをきっかけに
// 監視ループが自動的に再度立ち上がる。既存のholoStickerは監視対象に再登録されない)。
//
// バグ修正(コードレビュー指摘分・監視リストの脆弱な名前検索): 当初は監視リストに
// コンポ名の文字列だけを保存し、tick処理のたびにプロジェクト内を名前で再検索していた。
// このファイルの他の箇所(noise_001の特定など)で既に「AEは同名アイテムの重複を許すため
// 名前検索は脆弱」と学んでいたにもかかわらず、監視リストだけ同じ問題を抱えていた
// (ユーザーが無関係なコンポを偶然同じ名前にリネームしていた場合、誤ってそれを対象として
// 掴み削除してしまう危険があった)。修正: CompItemオブジェクトへの直接参照を監視リストに
// 保存し、tick側もその参照をそのまま使うように変更。参照先が削除済みの場合は
// プロパティアクセスが"ReferenceError: Object is invalid"を投げることを実機で確認済み
// なので、try/catchで「削除済み」として扱う。
//
// バグ修正(デバッグ依頼・実機検証で発見): addSolid()がAE既定で自動生成する"Solids"
// フォルダは、このスクリプトが作る全ての平面をSource_00Nへ移動した後も空のままProject
// ルートに残ってしまっていた(実機確認: 作成→タイムライン削除→自動監視でのフォルダ削除
// まで完走しても、本来Host側の1項目だけになるはずが空の"Solids"フォルダが1つ余分に
// 残る)。指示書手順2の「Projectが煩雑にならないよう…整理する」に反するため、
// organizeCreatedItems内で該当フォルダが空なら削除するremoveEmptyDefaultSolidsFolder()
// を追加(中身が残っている場合=ユーザーが他の平面を入れている場合は何もしない)。
//
// UI日英併記化(ユーザー要望): ダイアログのラベル・ヒント・ボタン、alert()/confirm()の
// メッセージを全て「日本語 / English」の順で併記するように変更。動作・レイアウト構造は
// 変えていない(multilineテキストは行数が増えた分だけpreferredSize.heightを調整)。
//
// バグ修正(ユーザー報告「3Dレイヤーを切って2D平面にすると手動回転が効かなくなる」):
// linkHoloRotationToTile内の回転式が、stickerレイヤーの3D専用プロパティ
// (transform.orientation/xRotation/yRotation/zRotation)を無条件に読んでいたため、
// 3Dスイッチを切って2D(平面の背景など)にすると、これらのプロパティが存在せず
// 1行目のorientation取得で例外が発生していた。try節は例外発生時点で即座に中断される
// ため、後続のmanual(Manual Rotationエフェクトの角度)取得までスキップされ、
// catch(eSticker){}で握りつぶされてmanualが常に0のまま=手動回転が完全に無反応になる
// 不具合だった(複数stickerがある場合、2D化した方だけこの症状が出る)。
// 修正: sticker.threeDLayerで分岐し、3Dのときは従来通りorientation込みのXYZ回転、
// 2Dのときはsticker.transform.rotation(単一値)をRZとして使うようにした。
// manualの取得はif/elseの外(だが同じtry節内)に出したので、3D/2Dどちらでも例外が
// 起きなければ必ず実行される。これでholoSticker_001/002とも3D/2Dどちらの状態でも
// 手動回転(Manual Rotation)とタイルの連動が機能する。
//
// バグ修正(ユーザー報告「3Dで回転させても連動しない」): 上記の修正で使った
// sticker.threeDLayerによる3D/2D判定が、実は機能していなかったことが実機検証で判明。
// このプロパティはExtendScript側(placedLayer.threeDLayerとして読む分)では正しく
// true/falseを返すが、**式(エクスプレッション)の中で読むと常にundefinedになる**
// (このAEバージョンのエクスプレッションエンジン固有の癖、typeof確認まで行い実機確認済み)。
// undefinedは falsy なので if (sticker.threeDLayer) は常にfalse扱いになり、レイヤーが
// 本当は3DでもelseのRZ = sticker.transform.rotation * 6だけが常に実行されていた。
// 3Dレイヤーでもtransform.rotationはzRotationのエイリアスとして動作するため例外は出ず、
// 見た目上は「たまに動いているように見えて実際はX/Y回転やOrientationでの操作が一切
// 反映されない」という発見しづらい不具合になっていた。
// 修正: sticker.threeDLayerの値を読むのをやめ、3D専用プロパティ(orientation/xRotation/
// yRotation/zRotation)へのアクセス自体をtry/catchで試す方式に変更。例外が出なければ
// (=これらのプロパティが実在する=)3Dとして扱いXYZ回転を合算、例外が出れば
// (2Dレイヤーにはこれらのプロパティが存在しないため)2Dとしてtransform.rotationのみを
// 使う。実機で3D(X/Y Rotation・Orientationどちらの操作方法でも)・2D・3D⇄2D切り替え
// 全パターンを再検証し、正しい値が伝播することを確認済み(詳細は本ファイルと同じ
// フォルダの[[holo-sticker-ae-script]]メモリ参照)。

(function () {

  // UI構築より前、createComp等がactiveItemを書き換える前に一度だけ取得しておく。
  var INITIAL_ACTIVE_COMP = (app.project && app.project.activeItem instanceof CompItem)
    ? app.project.activeItem
    : null;

  var CFG = {
    width: 1080,
    height: 1080,
    tilesPerSide: 10 // 指示書の既定値。UIで変更可能
  };

  // AEのコンポジションが取り得るピクセルサイズの範囲(実機確認済み: 3以下と30001以上は
  // addComp自体がエラーを投げる)。holoSticker_001本体・tile_001どちらのサイズ検証にも使う。
  var AE_MIN_COMP_SIZE = 4;
  var AE_MAX_COMP_SIZE = 30000;

  var CREATED_ITEMS = [];
  function track(item) {
    CREATED_ITEMS.push(item);
    return item;
  }

  // 幅・高さ・タイルの数は、いずれも前回値を記憶せず、何度起動しても常に既定値
  // (CFG.width/height=1080, CFG.tilesPerSide=10)から始まる(app.settingsに保存/復元しない)。

  function uniqueCompName(baseName) {
    var name = baseName;
    var n = 1;
    function exists(nm) {
      for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem && it.name === nm) return true;
      }
      return false;
    }
    while (exists(name)) {
      n++;
      name = baseName.replace(/_?\d*$/, "") + "_" + ("00" + n).slice(-3);
    }
    return name;
  }

  // ===== 手順1 =====
  function createHoloStickerComp(width, height, hostComp) {
    var name = uniqueCompName("holoSticker_001");
    var comp = app.project.items.addComp(
      name,
      width,
      height,
      hostComp.pixelAspect,
      hostComp.duration,
      hostComp.frameRate
    );
    var placedLayer = hostComp.layers.add(comp); // 既存コンポジション内に配置(中央に自動配置)
    track(comp);
    return { comp: comp, placedLayer: placedLayer };
  }

  // ===== 手順2〜7: tile_001の構築 =====
  function createTileComp(hostComp, tilesPerSide) {
    var tileSide = Math.round(hostComp.height / tilesPerSide); // 基準は縦(Y)の値

    var name = uniqueCompName("tile_001");
    var tileComp = app.project.items.addComp(
      name,
      tileSide,
      tileSide,
      hostComp.pixelAspect,
      hostComp.duration,
      hostComp.frameRate
    );
    track(tileComp);

    var GRAY_60 = [0.6, 0.6, 0.6];
    var GRAY_50 = [0.5, 0.5, 0.5];

    // addSolidは先に追加した方が下のレイヤーになるので、60%→50%の順で追加する
    var layer60 = tileComp.layers.addSolid(GRAY_60, "Gray 60%", tileSide, tileSide, tileComp.pixelAspect, tileComp.duration);
    track(layer60.source);
    var layer50 = tileComp.layers.addSolid(GRAY_50, "Neutral Gray 50%", tileSide, tileSide, tileComp.pixelAspect, tileComp.duration);
    track(layer50.source);

    applyBlockDissolve(layer50, tileSide); // 手順3

    var noiseSolidLayer = addNoiseLayer(tileComp, tileSide); // 手順4
    var noiseLayer = precomposeNoiseLayer(tileComp, noiseSolidLayer);
    freezeFrameAtZero(noiseLayer);
    applyRadialBlurScreen(noiseLayer);

    var lightSweepLayer = addLightSweepLayer(tileComp, tileSide); // 手順5
    var rgb = splitLightSweepRGB(tileComp, lightSweepLayer);      // 手順6
    addRotationNull(tileComp);
    linkDirectionToRotationNull(rgb.r);
    linkDirectionToRotationNull(rgb.g);
    linkDirectionToRotationNull(rgb.b);

    applyRadialBlur(rgb.r, 50); // 手順7
    applyRadialBlur(rgb.g, 50);
    applyRadialBlur(rgb.b, 50);

    return tileComp;
  }

  var BLOCK_DISSOLVE_TRANSITION_COMPLETION = 40; // 実機レンダーで2x2タイル状になることを確認済み

  function applyBlockDissolve(layer, tileSide) {
    var effects = layer.property("ADBE Effect Parade");
    var fx = effects.addProperty("ADBE Block Dissolve");
    fx.property(2).setValue(tileSide / 2); // Block Width = コンポの半分
    fx.property(3).setValue(tileSide / 2); // Block Height = コンポの半分
    fx.property(4).setValue(10);           // Feather(境界のぼかし)
    fx.property(5).setValue(0);            // Soft Edges オフ
    fx.property(1).setValue(BLOCK_DISSOLVE_TRANSITION_COMPLETION); // Transition Completion
    return fx;
  }

  function addNoiseLayer(tileComp, tileSide) {
    var solidLayer = tileComp.layers.addSolid([0, 0, 0], "Noise Source", tileSide, tileSide, tileComp.pixelAspect, tileComp.duration);
    track(solidLayer.source);

    var fx = solidLayer.property("ADBE Effect Parade").addProperty("ADBE Noise");
    fx.property(1).setValue(100); // Noise Amount
    fx.property(2).setValue(0);   // 表示名"Noise Type"だが実体は"Use Color Noise"チェックボックス。オフ=モノクロ

    return solidLayer;
  }

  function findLayerByName(comp, name) {
    for (var i = 1; i <= comp.numLayers; i++) {
      if (comp.layer(i).name === name) return comp.layer(i);
    }
    return null;
  }

  // コンポ名/レイヤー名をexpression文字列のダブルクォートリテラルに埋め込む前に必ず通す。
  // エスケープしないと、名前に " や \ を含むコンポ(例: My "Main" Comp)が既存(アクティブ)
  // コンポとして渡された場合、生成されるexpressionの文字列リテラルが途中で終端して構文エラーに
  // なり、エクスプレッションがExpression Disabled状態になって回転連動が丸ごと効かなくなる
  // (コードレビューで指摘、実装漏れを修正)。
  function escapeForExpressionString(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function precomposeNoiseLayer(tileComp, solidLayer) {
    var newComp = tileComp.layers.precompose([solidLayer.index], "noise_001", true);
    track(newComp);
    // 名前(文字列)ではなくnewComp参照そのものでレイヤーを特定する。
    // プロジェクト内に既に"noise_001"という名前のアイテムがあっても(AEは項目名の重複を
    // 許すため、precomposeは自動リネームしない)、参照で照合すれば取り違えない。
    for (var i = 1; i <= tileComp.numLayers; i++) {
      if (tileComp.layer(i).source === newComp) return tileComp.layer(i);
    }
    throw new Error("noise_001プリコンポーズ後のレイヤーが見つかりません");
  }

  function freezeFrameAtZero(layer) {
    layer.timeRemapEnabled = true;
    var tr = layer.property("ADBE Time Remapping");
    // numKeysを0まで削ると"hidden"扱いになりsetValueAtTimeが失敗するため、必ず1キーフレームは残す
    while (tr.numKeys > 1) tr.removeKey(tr.numKeys);
    tr.setValueAtTime(0, 0);
    tr.setInterpolationTypeAtKey(1, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
  }

  function applyRadialBlurScreen(layer) {
    var fx = layer.property("ADBE Effect Parade").addProperty("ADBE Radial Blur");
    fx.property("ADBE Radial Blur-0001").setValue(50); // Amount(property(1)は予約枠のためmatchName指定)
    layer.blendingMode = BlendingMode.SCREEN;
    return fx;
  }

  function applyRadialBlur(layer, amount) {
    var fx = layer.property("ADBE Effect Parade").addProperty("ADBE Radial Blur");
    fx.property("ADBE Radial Blur-0001").setValue(amount);
    return fx;
  }

  function addLightSweepLayer(tileComp, tileSide) {
    var solidLayer = tileComp.layers.addSolid([0, 0, 0], "Light Sweep", tileSide, tileSide, tileComp.pixelAspect, tileComp.duration);
    track(solidLayer.source);

    var fx = solidLayer.property("ADBE Effect Parade").addProperty("CC Light Sweep");
    // matchName直指定(表示名/index直指定はこの効果では罠があるため避ける)
    fx.property("CC Light Sweep-0001").setValue([tileSide / 2, tileSide / 2]); // Center
    fx.property("CC Light Sweep-0002").setValue(45);                          // Direction
    fx.property("CC Light Sweep-0005").setValue(50);                          // Sweep Intensity
    fx.property("CC Light Sweep-0007").setValue(0);                          // Edge Thickness

    solidLayer.blendingMode = BlendingMode.ADD;

    return solidLayer;
  }

  // ADBE Shift Channels: property(2)=Take Red From, (3)=Take Green From, (4)=Take Blue From
  // 各プロパティの自分自身(素通し)値はそれぞれ2/3/4、常に0を出す"Full Off"は10(実機で確認済み)
  var SHIFT_CHANNELS_SELF = { R: 2, G: 3, B: 4 };
  var SHIFT_CHANNELS_FULL_OFF = 10;

  function setShiftChannels(layer, onlyChannel) {
    var effects = layer.property("ADBE Effect Parade");
    var fx = effects.property("ADBE Shift Channels");
    if (!fx) fx = effects.addProperty("ADBE Shift Channels");
    // 既存インスタンスを再利用する場合、毎回3プロパティ全てを明示的に設定し直す
    // (でないと複製元の設定が残ってしまう)
    fx.property(2).setValue(onlyChannel === "R" ? SHIFT_CHANNELS_SELF.R : SHIFT_CHANNELS_FULL_OFF);
    fx.property(3).setValue(onlyChannel === "G" ? SHIFT_CHANNELS_SELF.G : SHIFT_CHANNELS_FULL_OFF);
    fx.property(4).setValue(onlyChannel === "B" ? SHIFT_CHANNELS_SELF.B : SHIFT_CHANNELS_FULL_OFF);
    return fx;
  }

  function setLightSweepDirectionWidth(layer, direction, width) {
    var fx = layer.property("ADBE Effect Parade").property("CC Light Sweep");
    fx.property("CC Light Sweep-0002").setValue(direction); // Direction
    fx.property("CC Light Sweep-0004").setValue(width);     // Width
  }

  function splitLightSweepRGB(tileComp, lightSweepLayer) {
    lightSweepLayer.name = "R";
    setShiftChannels(lightSweepLayer, "R");

    var gLayer = lightSweepLayer.duplicate();
    gLayer.name = "G";
    setShiftChannels(gLayer, "G");
    setLightSweepDirectionWidth(gLayer, 70, 60);

    var bLayer = gLayer.duplicate();
    bLayer.name = "B";
    setShiftChannels(bLayer, "B");
    setLightSweepDirectionWidth(bLayer, 25, 80);

    return { r: lightSweepLayer, g: gLayer, b: bLayer };
  }

  function addRotationNull(tileComp) {
    var nullLayer = tileComp.layers.addNull(tileComp.duration);
    nullLayer.name = "Rotation";
    track(nullLayer.source);
    return nullLayer;
  }

  function linkDirectionToRotationNull(layer) {
    var fx = layer.property("ADBE Effect Parade").property("CC Light Sweep");
    var dirProp = fx.property("CC Light Sweep-0002");
    dirProp.expression = 'value + thisComp.layer("Rotation").transform.rotation';
  }

  // ===== holoSticker_001側 =====
  function placeTileIntoSticker(stickerComp, tileComp) {
    var layer = stickerComp.layers.add(tileComp);
    layer.enabled = false;
    return layer;
  }

  // ===== 手順8: Particle Playgroundでタイルを敷き詰める =====
  function createTilesParticleGrid(stickerComp, tileLayer) {
    var w = stickerComp.width;
    var h = stickerComp.height;
    var tileSide = tileLayer.source.width; // tile_001は正方形なのでwidth=height
    // 指示書: 「パーティクル交差・降下とtile_001の大きさを計算して隙間なく敷き詰める」
    // holoSticker_001が非正方形でも縦横それぞれタイル実寸に合わせて算出する。
    // [罠、実機で発見・修正]: Grid Width/Heightをコンポサイズそのまま(w, h)にすると、
    // w/tileSide や h/tileSide が割り切れない組み合わせ(コンポサイズ・タイル数の
    // 選び方次第で普通に起こる)で端数が生じ、Grid幅÷Particles数がtileSideと完全には
    // 一致しないため、隙間または重なりが出ることがあった。修正: Particles Across/Downは
    // 必ず切り上げ(Math.ceil、コンポ全体を隙間なく覆うことを優先)で求め、Grid Width/Height
    // はコンポサイズではなく「タイル実寸×個数」の整数倍にする。これによりGrid幅÷Particles数が
    // 常にtileSideと完全一致し、どんなコンポサイズ・タイル数の組み合わせでも隙間が出ない
    // (敷き詰めた範囲がコンポの外に少しはみ出ることがあるが、はみ出た部分はコンポの外なので
    // 見た目には影響しない)。
    var particlesAcross = Math.max(1, Math.ceil(w / tileSide));
    var particlesDown = Math.max(1, Math.ceil(h / tileSide));
    var gridWidth = particlesAcross * tileSide;
    var gridHeight = particlesDown * tileSide;

    var tilesLayer = stickerComp.layers.addSolid([0, 0, 0], "Tiles", w, h, stickerComp.pixelAspect, stickerComp.duration);
    track(tilesLayer.source);

    var fx = tilesLayer.property("ADBE Effect Parade").addProperty("ADBE Playgnd");

    fx.property("ADBE Playgnd-0103").setValue(0); // Cannon Particles Per Second(キャノン不使用)
    fx.property("ADBE Playgnd-0110").setValue(0); // Cannon Particle Radius
    fx.property("ADBE Playgnd-0331").setValue(0); // Gravity Force(重力不要)
    // Grid Position(実機確認: 既定値はコンポ中心=[w/2, h/2]で、Grid Width/Heightはこの点を
    // 中心に左右・上下均等に広がる)。既定のままだとgridWidth/Heightがコンポサイズより
    // 大きい(端数切り上げ)場合、はみ出し分が四辺すべてに均等に散ってしまい、左上のタイルの
    // 左上端がコンポの左上端(0,0)に一致しない。Positionを[gridWidth/2, gridHeight/2]にすると
    // グリッドの左上端がちょうど(0,0)になり、はみ出しは右・下方向だけに寄る(要望通り)。
    fx.property("ADBE Playgnd-0131").setValue([gridWidth / 2, gridHeight / 2]); // Grid Position
    fx.property("ADBE Playgnd-0132").setValue(gridWidth);  // Grid Width = タイル実寸の整数倍
    fx.property("ADBE Playgnd-0133").setValue(gridHeight); // Grid Height = タイル実寸の整数倍
    fx.property("ADBE Playgnd-0134").setValue(particlesAcross); // Particles Across
    fx.property("ADBE Playgnd-0135").setValue(particlesDown);   // Particles Down

    // 最初の1回だけ発生させる: t=0は既定半径のまま、1フレーム後に半径0にする
    var radiusProp = fx.property("ADBE Playgnd-0136"); // Grid Particle Radius
    var defaultRadius = radiusProp.value;
    var frameTime = 1 / stickerComp.frameRate;
    radiusProp.setValueAtTime(0, defaultRadius);
    radiusProp.setValueAtTime(frameTime, 0);

    fx.property("ADBE Playgnd-0281").setValue(tileLayer.index); // Layer Map > Use Layer

    return tilesLayer;
  }

  // ===== 手順9: holoSticker_001の回転とtile_001内Rotationヌルを連動 =====
  // ===== 手順10: 角度コントロールで手動オフセットも追加 =====
  var MANUAL_ROTATION_CONTROL_NAME = "Manual Rotation";

  function addManualRotationControl(placedLayer) {
    // 再リンク時に同じレイヤーへ再度呼ばれても二重に追加しないよう、既存インスタンスを再利用する
    var effects = placedLayer.property("ADBE Effect Parade");
    var fx = effects.property(MANUAL_ROTATION_CONTROL_NAME);
    if (!fx) {
      fx = effects.addProperty("ADBE Angle Control");
      fx.name = MANUAL_ROTATION_CONTROL_NAME;
    }
    return fx;
  }

  function linkHoloRotationToTile(placedLayer, tileComp, hostCompName) {
    placedLayer.threeDLayer = true;

    var safeHostCompName = escapeForExpressionString(hostCompName);
    var safePlacedLayerName = escapeForExpressionString(placedLayer.name);

    var rotationNull = findLayerByName(tileComp, "Rotation");
    var expr =
      // [重要な罠、実機で発見・修正]: AEはエクスプレッションが未処理の例外を投げると
      // そのプロパティのエクスプレッションを自動的に"Expression Disabled"状態にし、
      // 原因(参照先レイヤーが無い等)が解消されても自動では復活しない。ユーザーがsticker
      // レイヤーを一時的にタイムラインから削除→Projectパネルから戻す、という操作をすると
      // 再現する(実機で確認: 削除時にエラーで無効化され、戻しても無効化されたまま)。
      // 対策: sticker/カメラへのアクセスをtry/catchで包み、レイヤーが無い間は安全に
      // 寄与を0として扱う。これで未処理エラーが発生しないためエクスプレッションは常に
      // 有効なままになり、レイヤーが戻ってくれば次のフレームで自動的に復活する。
      'var host = comp("' + safeHostCompName + '");\n' +
      'var RX = 0, RY = 0, RZ = 0, manual = 0;\n' +
      'try {\n' +
      '  var sticker = host.layer("' + safePlacedLayerName + '");\n' +
      // [重要な罠、実機で発見・修正]: 3D/2D判定に sticker.threeDLayer を使っていたが、
      // このプロパティはExtendScript側(placedLayer.threeDLayer)では正しくtrue/falseを
      // 返すのに、**エクスプレッション内で読むと常にundefinedになる**(このAEバージョンの
      // 既知の癖、実機検証で確認済み)。結果、if文が常にfalse扱いになり、実際は3Dレイヤー
      // でも常にelse分岐(2D用のtransform.rotationのみ)が実行されていた。2Dのtransform.
      // rotationは3DレイヤーではzRotationのエイリアスとして働くため、X/Y Rotationや
      // Orientationで回転させてもRZに反映されず(3D操作ではzRotationが変化しないことが
      // 多い)、「3Dで回転させても連動しない」不具合になっていた(ユーザー報告で発覚)。
      // 対策(初回): threeDLayerの真偽値を読むのではなく、3D専用プロパティ(orientation/
      // xRotation/yRotation/zRotation)への実際のアクセスをtry/catchで試し、例外が出なければ
      // 3D、例外が出れば2Dと判定する……はずだったが、これも別の罠があった。下記の
      // 「2D判定方法の再修正」を参照(最終的な判定は fwd.length で行っている)。
      //
      // [追加のバグ修正、ユーザー報告「3Dの他オブジェクトにペアレントした状態で親を
      // 回転させると連動が外れる」]: 3D判定後もsticker.transform.xRotation/yRotation/
      // zRotation/orientationという「ローカル値」をそのまま使っていたため、sticker自身を
      // 回さず親(ペアレント先)だけを回したケースが一切反映されなかった(ローカル値は
      // 親を回しても変化しない、カメラを親nullに付けてロールさせた時と全く同じ罠)。
      // 対策: カメラのCX/CY/CZ計算と同じ手法(toWorldVec()でホスト座標系におけるワールド
      // 空間の向きを直接測る)をsticker自身にも適用。sticker.toWorldVec(...)は親子付けの
      // 影響を自動的に含むワールド空間の値を返すため、sticker自身のX/Y/Z Rotation・
      // Orientationでの回転と、親(何段ネストしていても)の回転の両方を、追加のコードなしで
      // 同時に拾える。実機検証: 親のみ回転(sticker自身は無回転)→正しく反応、sticker自身の
      // みの回転(親は無回転)→従来同様に反応、両方同時に回転→両方の寄与を合成した値になる
      // ことを確認済み。
      // [制約、実機で発見・現時点では未解決]: 既に付いている親「を回転させる」操作は
      // 正しく反応するが、「親子付けそのものを付け外しする」操作(sticker.parent =
      // 別レイヤー、または親を外す)は、toWorldVec()の内部キャッシュが即座には更新されない
      // ことがある(スクリプトから.parentを差し替えた直後、大きく時間を進めても・
      // エクスプレッション文字列を書き直しても値が古いままになる不具合を実機で確認、
      // sticker自身の他プロパティを変更すると再計算はされるが、そのときも古い親の寄与を
      // 引きずったままになることがある)。AEのエクスプレッションエンジン側のキャッシュ問題と
      // 見られ、このスクリプト側では対処できていない。実運用でユーザーがタイムラインパネルで
      // 親子付けを変更した直後は、念のため一度タイムラインを少しスクラブする(再生ヘッドを
      // 動かす)ことを推奨する。詳細は[[adobe-scripting-via-osascript]]参照。
      //
      // [2D判定方法の再修正、ユーザー報告「2Dにするとエクスプレッションエラーが出て
      // 手動回転ができなくなる」]: 直前の修正で使った「sticker.transform.orientation
      // へのアクセスをtry/catchで試す」方式が、実は機能していなかったことが実機検証で
      // 判明。原因は2つ重なっていた。①このスクリプトはstickerを必ず一度3Dで作成してから
      // (541行目のplacedLayer.threeDLayer=true)ユーザーが2Dに切り替える、という順序で
      // 使われるが、**一度でも3Dになったレイヤーは、後で2Dに戻しても
      // sticker.transform.orientation/xRotationへのアクセス自体は例外を投げず、
      // 静かにundefinedを返すだけ**(最初から一度も3Dになったことがないレイヤーでは
      // 逆に例外を投げる、という実機確認済みの非対称な挙動)。②その結果、判定に失敗して
      // 常に3D分岐に入ってしまうが、さらに**2Dレイヤーのsticker.toWorldVec(...)は
      // 3要素[x,y,z]ではなく2要素[x,y]の配列を返す**(実機確認済み)ため、3D分岐内で
      // fwd[2]を読むとundefinedになり、Math.atan2の結果がNaNになって最終的に
      // 「couldn't turn result into numeric value」でエクスプレッションごと無効化されて
      // いた(この時点でmanualの取得にも到達しないため、手動回転(Manual Rotation)も
      // 反応しなくなっていた)。
      // 対策(最終): 2D/3D判定にorientation/xRotationへのアクセスを使うのをやめ、
      // sticker.toWorldVec(...)が返す配列のlengthで判定する(3なら3D、2なら2D、という
      // 挙動は現在のレイヤー状態そのものを反映しており、過去に3Dだったかどうかの履歴には
      // 影響されないことを実機確認済み)。実機で「常に2Dのレイヤー」「3D作成後に2Dへ切替」
      // 「3D」の3パターン全てで、エラー無しかつ正しい値になることを確認済み。
      '  try {\n' +
      '    var fwd = sticker.toWorldVec([0, 0, 1]);\n' +
      '    if (fwd.length < 3) { throw "sticker2D"; }\n' +
      '    RY = Math.atan2(fwd[0], fwd[2]) / Math.PI * 180 * 6;\n' +
      '    RX = Math.atan2(-fwd[1], fwd[2]) / Math.PI * 180 * 6;\n' +
      '    var up = sticker.toWorldVec([0, -1, 0]);\n' +
      '    var worldUp = [0, -1, 0];\n' +
      '    var refCross = cross(worldUp, fwd);\n' +
      '    if (length(refCross) > 0.0001) {\n' + // sticker正面がほぼ真上/真下を向く縮退ケースの安全策(カメラと同じガード)
      '      var refRight = normalize(refCross);\n' +
      '      var refUp = cross(fwd, refRight);\n' +
      '      var rollDeg = Math.atan2(dot(up, refRight), dot(up, refUp)) / Math.PI * 180;\n' +
      '      RZ = -rollDeg * 6;\n' +
      '    }\n' +
      '  } catch (eNot3D) {\n' +
      '    RZ = sticker.transform.rotation * 6;\n' +
      '  }\n' +
      // [言語版バグ、実機で発見・修正]: "Angle"はAngle Controlエフェクトの
      // プロパティの「表示名」で、日本語版AEでは"角度"に翻訳されているため
      // 名前参照だと見つからず例外→外側catchで握りつぶされてmanualが常に0になり
      // 日本語版でのみ手動回転が無反応になっていた。matchName("ADBE Angle
      // Control-0001")は言語に依存しないため、英語版・日本語版どちらでも動く。
      '  manual = sticker.effect("' + MANUAL_ROTATION_CONTROL_NAME + '")("ADBE Angle Control-0001");\n' +
      '} catch (eSticker) {}\n' +
      'var CX = 0, CY = 0, CZ = 0;\n' +
      'try {\n' +
      '  var cam = host.activeCamera;\n' +
      // [重要な罠、実機で発見]: カメラレイヤーが1つも無くても thisComp.activeCamera は
      // 常に truthy な「Default」という名前の暗黙カメラを返す(nullにはならない)。
      // そのため cam の真偽値だけでは「本物のカメラが存在するか」を判定できない。
      // host内の実レイヤーと同一オブジェクトかどうかで本物のカメラかを確認する。
      '  var isRealCamera = false;\n' +
      '  if (cam) {\n' +
      '    for (var ci = 1; ci <= host.numLayers; ci++) {\n' +
      '      if (host.layer(ci) === cam) { isRealCamera = true; break; }\n' +
      '    }\n' +
      '  }\n' +
      '  if (isRealCamera) {\n' +
      // 既定のカメラ(Point of Interestあり)はオービット操作だとPositionだけが動き、
      // X/Y Rotationプロパティは0のままになる(実機で確認済みの罠)ため、それらの値を
      // 直接読まず、カメラの視線方向ベクトルから求める。
      // [罠、実機で発見・修正]: 当初はsticker.fromWorldVec(...)でsticker自身のローカル
      // 座標に変換していたが、これだとカメラの角度に「stickerの現在の回転」がすでに
      // 織り込まれてしまい、RX/RY/RZ(sticker自身の回転)と二重にカウントされて正負が
      // 打ち消し合い、sticker回転+カメラを同時に使うとsticker回転側の連動が丸ごと
      // 効かなくなる不具合になっていた(実機で発見: sticker RotateX=20→RX=120に対し
      // カメラ項CX=-120と正確に相殺していた)。修正: hostの座標系(=sticker自身の回転の
      // 影響を受けない固定基準)でカメラの視線ベクトルを測ることで、sticker自身の回転と
      // カメラの動きを二重カウントせず独立して加算できるようにした。
      '    var camForward = cam.toWorldVec([0, 0, 1]);\n' +
      '    CY = Math.atan2(camForward[0], camForward[2]) / Math.PI * 180 * 6;\n' +
      '    CX = Math.atan2(-camForward[1], camForward[2]) / Math.PI * 180 * 6;\n' +
      // [重要な罠、実機で発見・修正]: cam.transform.zRotation / orientation はカメラ
      // レイヤー自身のローカル値でしかなく、カメラを別レイヤー(オービット用のnullなど、
      // よくある「カメラをnullに親子付けしてnullを回転させる」rig)に親子付けしている場合、
      // 親を回してカメラをロールさせてもカメラ自身のローカル値は0のまま変化しないため、
      // 一切反映されない不具合になっていた(実機で確認: "Camera 1"を"Orbit Null"に
      // 親子付けしてnull側のZ Rotationを回しても、camera自身のzRotation/orientationは
      // 変化せずCZが常に0のままだった)。修正: ローカル値を読むのではなく、CX/CYと同様に
      // toWorldVec()で親子付けの影響を含めたワールド空間のカメラの向きから直接ロール角を
      // 算出する(カメラのワールド空間"上"ベクトルを、ロール0のときの基準"上"ベクトルと
      // 比較する角度差として求める)。
      '    var camUp = cam.toWorldVec([0, -1, 0]);\n' +
      '    var worldUp = [0, -1, 0];\n' +
      '    var refCross = cross(worldUp, camForward);\n' +
      '    if (length(refCross) > 0.0001) {\n' + // カメラがほぼ真上/真下を向く縮退ケースの安全策
      '      var refRight = normalize(refCross);\n' +
      '      var refUp = cross(camForward, refRight);\n' +
      '      var rollDeg = Math.atan2(dot(camUp, refRight), dot(camUp, refUp)) / Math.PI * 180;\n' +
      '      CZ = -rollDeg * 6;\n' +
      '    }\n' +
      '  }\n' +
      '} catch (eCam) {}\n' +
      'RX + RY + RZ + manual + CX + CY + CZ;';
    rotationNull.property("ADBE Transform Group").property("ADBE Rotate Z").expression = expr;
  }

  // targetComp(holoSticker_00Nの項目)が現在プロジェクト内のどのコンポの何番目の
  // レイヤーとして配置されているかを探す。エクスプレッションからはapp.projectに
  // アクセスできない(実機で確認済み: ReferenceError: app is not defined)ため、
  // 通常のExtendScript側でこの検索を行う(自動監視・削除処理から使用)。
  function findCurrentPlacement(targetComp) {
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof CompItem) {
        for (var j = 1; j <= it.numLayers; j++) {
          if (it.layer(j).source === targetComp) {
            return { hostComp: it, placedLayer: it.layer(j) };
          }
        }
      }
    }
    return null;
  }

  // ===== 削除処理: レイヤーとProject内の関連アイテム・フォルダをまとめて削除する(自動監視から使用) =====
  // AEにはスクリプトが「タイムラインからレイヤーが削除された」ことを検知できるフックが無いため
  // (実機・ドキュメント両面で確認済みの制約)、削除を自動追従させることはできない。代わりに、
  // 「タイムラインからの削除」と「Project内の関連アイテム削除」を1回のボタン操作でまとめて
  // 行えるようにする。organizeCreatedItemsで生成物は全て1つのフォルダにまとめてあるため、
  // そのフォルダの中身を丸ごと削除すればよい(内部のレイヤー構造を個別に辿る必要がない)。
  function deleteHoloStickerAndFolder(stickerComp) {
    var removedNames = [];

    var placement = findCurrentPlacement(stickerComp);
    if (placement) {
      removedNames.push("[レイヤー] " + placement.placedLayer.name + " (in " + placement.hostComp.name + ")");
      try { placement.placedLayer.remove(); } catch (e) {}
    }

    var folder = stickerComp.parentFolder;
    if (folder && folder instanceof FolderItem) {
      // Source_00Nサブフォルダを含む構造になったため、非フォルダ項目を先に全て削除し、
      // フォルダは内側(Source_00N)から順に削除する(空でないフォルダの削除に頼らない)。
      var nonFolderItems = [];
      var folders = [];
      (function collect(f) {
        for (var i = 1; i <= f.numItems; i++) {
          var it = f.item(i);
          if (it instanceof FolderItem) {
            collect(it);
            folders.push(it);
          } else {
            nonFolderItems.push(it);
          }
        }
      })(folder);

      for (var j = 0; j < nonFolderItems.length; j++) {
        removedNames.push(nonFolderItems[j].name);
        try { nonFolderItems[j].remove(); } catch (e) {}
      }
      for (var k = 0; k < folders.length; k++) {
        removedNames.push("[フォルダ] " + folders[k].name);
        try { folders[k].remove(); } catch (e) {}
      }
      removedNames.push("[フォルダ] " + folder.name);
      try { folder.remove(); } catch (e) {}
    } else {
      removedNames.push(stickerComp.name);
      try { stickerComp.remove(); } catch (e) {}
    }

    return removedNames;
  }

  // ===== 自動監視: タイムラインからの削除を検知し、確認の上でフォルダも削除する =====
  // 実機で検証済み: app.scheduleTask(...,repeat=true)は本当に繰り返し実行され、
  // app.cancelTask()で停止でき、スケジュールされたタスクの中からconfirm()を呼んでも
  // 本物のインタラクティブなダイアログとして正しく表示・ブロックされる(ユーザーと一緒に
  // 実機確認済み)。$.globalはセッション全体で共有されるため、監視リスト・タスクIDは
  // $.globalに保持し、スクリプトを何度再実行しても重複起動しないようにする。
  var WATCH_POLL_INTERVAL_MS = 2000;

  function ensureWatcherRunning() {
    if ($.global.HOLO_WATCH_TASK_ID) return; // 既に稼働中
    $.global.HOLO_WATCH_LIST = $.global.HOLO_WATCH_LIST || [];

    // findCurrentPlacement/deleteHoloStickerAndFolderをクロージャ経由で再利用する。
    // このIIFEが既に終了した後(スケジュールされた時点)でも、クロージャにより
    // これらの関数へのアクセスは保持され続ける。
    $.global.holoStickerWatchTick = function () {
      try {
        var list = $.global.HOLO_WATCH_LIST || [];
        if (list.length === 0) {
          if ($.global.HOLO_WATCH_TASK_ID) { try { app.cancelTask($.global.HOLO_WATCH_TASK_ID); } catch (eCancel) {} }
          $.global.HOLO_WATCH_TASK_ID = null;
          return;
        }
        for (var i = list.length - 1; i >= 0; i--) {
          var entry = list[i];
          // [コードレビュー指摘・修正]: 名前文字列での再検索は、ユーザーが無関係な
          // コンポを偶然同じ名前(例: "holoSticker_002")にリネームしていた場合に
          // それを誤って対象コンポとして掴んでしまう危険があった(確認は出るが、
          // 無関係なコンポ・フォルダを削除しうる)。このファイルの他の箇所(noise_001の
          // 特定など)と同様、名前ではなくCompItemオブジェクトへの直接参照で対象を
          // 特定するように変更。参照先が削除済みだとプロパティアクセスが
          // "ReferenceError: Object is invalid" を投げることを実機で確認済みなので、
          // try/catchで「削除済み」として扱う。
          var stickerComp = entry.stickerComp;
          var isValid = false;
          try { isValid = !!stickerComp && stickerComp instanceof CompItem && !!stickerComp.name; } catch (eInvalid) { isValid = false; }
          if (!isValid) { list.splice(i, 1); continue; } // 参照先(プロジェクトアイテム)が既に無い

          if (!findCurrentPlacement(stickerComp)) {
            list.splice(i, 1); // 二重に尋ねないよう先にリストから外す
            var doDelete;
            if (typeof $.global.HOLO_TEST_AUTO_CONFIRM_ANSWER !== "undefined") {
              doDelete = $.global.HOLO_TEST_AUTO_CONFIRM_ANSWER; // テスト用: 実際のconfirm()を呼ばない
            } else {
              doDelete = confirm(
                '"' + entry.stickerName + '" がタイムラインから削除されたようです。\n' +
                'Project内の関連アイテムとフォルダも削除しますか?\n\n' +
                '"' + entry.stickerName + '" appears to have been deleted from the timeline.\n' +
                'Also delete the related Project items and folder?');
            }
            if (doDelete) {
              app.beginUndoGroup("holoSticker_AEhack: auto cleanup");
              try { deleteHoloStickerAndFolder(stickerComp); } finally { app.endUndoGroup(); }
            }
          }
        }
      } catch (eTick) {
        // 監視ループ自体は例外で止めない
      }
    };

    $.global.HOLO_WATCH_TASK_ID = app.scheduleTask("$.global.holoStickerWatchTick()", WATCH_POLL_INTERVAL_MS, true);
  }

  function registerWatch(stickerComp, folderName) {
    $.global.HOLO_WATCH_LIST = $.global.HOLO_WATCH_LIST || [];
    for (var i = 0; i < $.global.HOLO_WATCH_LIST.length; i++) {
      if ($.global.HOLO_WATCH_LIST[i].stickerComp === stickerComp) return; // 二重登録しない(参照比較)
    }
    // stickerNameはconfirm()の表示文言用にキャッシュしておく(対象特定そのものはstickerCompの
    // オブジェクト参照で行う。名前は後からリネームされる可能性もあるが表示用途のみなので許容)。
    $.global.HOLO_WATCH_LIST.push({ stickerComp: stickerComp, stickerName: stickerComp.name, folderName: folderName });
    ensureWatcherRunning();
  }

  // ===== プロジェクト整理 =====
  // holoSticker_00N フォルダの直下にはメインコンポ自身だけを置き、それ以外(tile_001,
  // noise_001, 各種solid等)は同フォルダ内のSource_00Nサブフォルダにまとめる。
  function findOrCreateFolder(name) {
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof FolderItem && it.name === name) return it;
    }
    return app.project.items.addFolder(name);
  }

  function findOrCreateSubfolder(parentFolder, name) {
    for (var i = 1; i <= parentFolder.numItems; i++) {
      var it = parentFolder.item(i);
      if (it instanceof FolderItem && it.name === name) return it;
    }
    var sub = app.project.items.addFolder(name);
    sub.parentFolder = parentFolder;
    return sub;
  }

  function folderNameForComp(comp) {
    var m = comp.name.match(/(\d+)$/);
    return "holoSticker_" + (m ? m[1] : "001");
  }

  function sourceFolderNameForComp(comp) {
    var m = comp.name.match(/(\d+)$/);
    return "Source_" + (m ? m[1] : "001");
  }

  // [バグ修正・実機で発見(デバッグ依頼分)]: addSolid()はAEが既定で"Solids"という名前の
  // フォルダをProjectルートに自動生成する。このスクリプトが作る平面は全てtrack()経由で
  // Source_00Nへ移動済みだが、AEが自動生成した"Solids"フォルダ自体は移動対象に含めていな
  // かったため、生成物を全部削除(deleteHoloStickerAndFolder)した後も空の"Solids"フォルダ
  // だけがProjectルートに残ってしまっていた(実機確認: 削除前12項目→削除後、本来1項目
  // (Host_001のみ)のはずが2項目残る)。指示書手順2の「Projectが煩雑にならないよう…整理
  // する」に反するため、ここで空になった時点のSolidsフォルダを削除する。中身が残って
  // いる(=ユーザーが他の平面をSolidsフォルダに入れている)場合は何もしない。
  function removeEmptyDefaultSolidsFolder() {
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof FolderItem && it.name === "Solids" && it.numItems === 0) {
        try { it.remove(); } catch (e) {}
      }
    }
  }

  function organizeCreatedItems(mainComp, folderName) {
    var folder = findOrCreateFolder(folderName);
    mainComp.parentFolder = folder; // メインコンポはholoSticker_00N直下

    var sourceFolder = findOrCreateSubfolder(folder, sourceFolderNameForComp(mainComp));
    for (var i = 0; i < CREATED_ITEMS.length; i++) {
      if (CREATED_ITEMS[i] === mainComp) continue; // メインコンポ以外をSource_00Nへ
      try { CREATED_ITEMS[i].parentFolder = sourceFolder; } catch (e) {}
    }

    removeEmptyDefaultSolidsFolder();
  }

  // ===== UI =====
  function buildUI(thisObj) {
    var win = (thisObj instanceof Panel)
      ? thisObj
      : new Window("dialog", "holoSticker_AEhack");

    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.margins = 16;
    win.spacing = 10;

    // UI文言は日本語 / English の順で併記する(ユーザー要望)。
    function infoText(comp) {
      return "配置先 / Placed into: " + comp.name +
        " (" + comp.frameRate + "fps, " + comp.duration.toFixed(2) + "s)";
    }

    var info = win.add("statictext", undefined, infoText(INITIAL_ACTIVE_COMP));
    info.alignment = ["fill", "top"];

    var sizeGroup = win.add("group");
    sizeGroup.add("statictext", undefined, "幅/Width (px):");
    var etWidth = sizeGroup.add("edittext", undefined, String(CFG.width));
    etWidth.characters = 6;
    sizeGroup.add("statictext", undefined, "高さ/Height (px):");
    var etHeight = sizeGroup.add("edittext", undefined, String(CFG.height));
    etHeight.characters = 6;

    var hint = win.add("statictext", undefined,
      "(推奨は正方形ですが、どのような大きさでも作成できます)\n" +
      "(Square is recommended, but any size can be created)",
      { multiline: true });
    hint.alignment = ["fill", "top"];
    hint.preferredSize.height = 32;

    var tilesGroup = win.add("group");
    tilesGroup.add("statictext", undefined, "タイルの数(1辺あたり)/Tiles per side:");
    var etTilesPerSide = tilesGroup.add("edittext", undefined, String(CFG.tilesPerSide));
    etTilesPerSide.characters = 4;

    var tilesHint = win.add("statictext", undefined,
      "(縦方向のタイルの数です。横は縦に合わせて自動で配置されます)\n" +
      "(Number of tiles along the height. Width is filled automatically to match)",
      { multiline: true });
    tilesHint.alignment = ["fill", "top"];
    tilesHint.preferredSize.height = 32;

    var watchHint = win.add("statictext", undefined,
      "作成すると自動で監視対象になり、タイムラインから削除されると確認の上でProject内の\n" +
      "関連アイテム・フォルダも自動で削除されます。\n" +
      "Created items are watched automatically; deleting them from the timeline will,\n" +
      "after confirmation, also remove the related Project items/folder.",
      { multiline: true });
    watchHint.alignment = ["fill", "top"];
    watchHint.preferredSize.height = 48; // multiline:trueだけでは自動で高さが確保されないため明示指定(JP/EN4行分)

    var btnGroup = win.add("group");
    btnGroup.alignment = ["fill", "bottom"];
    var btnOK = btnGroup.add("button", undefined, "作成 / Create", { name: "ok" });
    var btnCancel = btnGroup.add("button", undefined, "キャンセル / Cancel", { name: "cancel" });

    btnOK.onClick = function () {
      // パネルとして常駐している間にユーザーがアクティブコンポを切り替えている可能性があるため、
      // モジュール起動時に一度だけ取得したINITIAL_ACTIVE_COMPには頼らず、クリック時点で
      // 改めてアクティブコンポを取得する(ダイアログモードでは実質無害な再取得、パネル
      // モードではこれが無いと切り替え前の古い/閉じられたコンポに配置してしまうバグになる)。
      var activeComp = (app.project && app.project.activeItem instanceof CompItem)
        ? app.project.activeItem
        : null;
      if (!activeComp) {
        alert("holoSticker_AEhack: アクティブなコンポジションがありません。\n" +
          "holoSticker_001 を配置したいコンポジションを開いた状態で実行してください。\n\n" +
          "holoSticker_AEhack: There is no active composition.\n" +
          "Please open the composition you want to place holoSticker_001 into, then run again.");
        return;
      }
      info.text = infoText(activeComp);

      var vw = parseInt(etWidth.text, 10);
      var vh = parseInt(etHeight.text, 10);
      var vt = parseInt(etTilesPerSide.text, 10);
      // AEのコンポジションは4〜30000pxの範囲でなければaddComp自体が例外を投げる(実機確認済み)。
      if (isNaN(vw) || vw < AE_MIN_COMP_SIZE || vw > AE_MAX_COMP_SIZE ||
          isNaN(vh) || vh < AE_MIN_COMP_SIZE || vh > AE_MAX_COMP_SIZE) {
        alert("正しいサイズを入力してください(" + AE_MIN_COMP_SIZE + "〜" + AE_MAX_COMP_SIZE + "の整数)。\n\n" +
          "Please enter a valid size (an integer between " + AE_MIN_COMP_SIZE + " and " + AE_MAX_COMP_SIZE + ").");
        return;
      }
      if (isNaN(vt) || vt <= 0) {
        alert("正しいタイルの数(正の整数)を入力してください。\n\n" +
          "Please enter a valid number of tiles (a positive integer).");
        return;
      }
      // タイルの数が大きすぎると、tile_001の1辺(=高さ÷タイルの数、四捨五入)がAEの最小コンポ
      // サイズ(4px)を下回り、addComp自体がAEの生の例外を出して失敗する(コードレビューで指摘)。
      // 事前に計算し、分かりやすい日本語のエラーメッセージで止める。
      var previewTileSide = Math.round(vh / vt);
      if (previewTileSide < AE_MIN_COMP_SIZE) {
        alert("タイルの数が大きすぎます。\n" +
          "高さ(" + vh + "px)をタイルの数(" + vt + ")で割るとタイル1辺が" + previewTileSide + "pxになり、" +
          "小さすぎて作成できません(最小" + AE_MIN_COMP_SIZE + "px必要)。\n" +
          "タイルの数を減らすか、高さを大きくしてください。\n\n" +
          "Too many tiles.\n" +
          "Height (" + vh + "px) divided by the number of tiles (" + vt + ") gives a tile side of " +
          previewTileSide + "px, which is too small to create (minimum " + AE_MIN_COMP_SIZE + "px).\n" +
          "Please reduce the number of tiles or increase the height.");
        return;
      }
      CFG.width = vw;
      CFG.height = vh;
      CFG.tilesPerSide = vt;

      app.beginUndoGroup("holoSticker_AEhack: create holoSticker_001");
      CREATED_ITEMS.length = 0;
      try {
        var created = createHoloStickerComp(CFG.width, CFG.height, activeComp);
        var comp = created.comp;
        var placedLayer = created.placedLayer;
        var tileComp = createTileComp(comp, CFG.tilesPerSide);
        var tileLayer = placeTileIntoSticker(comp, tileComp);
        createTilesParticleGrid(comp, tileLayer);
        addManualRotationControl(placedLayer);
        linkHoloRotationToTile(placedLayer, tileComp, activeComp.name);
        organizeCreatedItems(comp, folderNameForComp(comp));
        registerWatch(comp, folderNameForComp(comp)); // タイムラインからの削除を自動監視する
        // comp.openInViewer()はactiveItemを新規holoSticker自身に切り替えてしまい、
        // 「もう1個作りたい時はスクリプトを再度起動する」運用で次回実行時にactiveComp
        // として拾われ、2個目がholoSticker_001の中にネストされてしまうバグの原因になって
        // いたため、新規コンポは開かずactiveComp(元のホスト)をアクティブなままにする。
        activeComp.openInViewer();
      } catch (e) {
        alert("エラー / Error: " + e.toString());
      } finally {
        app.endUndoGroup();
      }

      if (win instanceof Window) win.close();
    };

    if (btnCancel) {
      btnCancel.onClick = function () {
        if (win instanceof Window) win.close();
      };
    }

    if (win instanceof Window) {
      win.center();
      win.show();
    } else {
      win.layout.layout(true);
    }

    return win;
  }

  // --- エントリーポイント ---

  if ($.global.HOLO_NO_UI_DELETE) {
    // テスト用: 「削除」ボタンの内部ロジックをUIを介さず直接検証する
    try {
      var deleteTargetName = $.global.HOLO_DELETE_TARGET_NAME;
      var deleteTargetComp = null;
      for (var di = 1; di <= app.project.numItems; di++) {
        var dit = app.project.item(di);
        if (dit instanceof CompItem && dit.name === deleteTargetName) { deleteTargetComp = dit; break; }
      }
      if (!deleteTargetComp) {
        $.global.HOLO_DELETE_RESULT = { ok: false, removed: [] };
      } else {
        var removedList = deleteHoloStickerAndFolder(deleteTargetComp);
        $.global.HOLO_DELETE_RESULT = { ok: true, removed: removedList };
      }
    } catch (e) {
      $.global.HOLO_DELETE_RESULT = { ok: false, removed: [], error: e.toString() };
    }
    return;
  }

  if ($.global.HOLO_NO_UI_REGISTER_WATCH) {
    // テスト用: 監視登録をUIを介さず直接行う(scheduleTaskの発火自体は実際のタイマーに任せる)
    try {
      var watchTargetName = $.global.HOLO_WATCH_TARGET_NAME;
      var watchTargetComp = null;
      for (var wi = 1; wi <= app.project.numItems; wi++) {
        var wit = app.project.item(wi);
        if (wit instanceof CompItem && wit.name === watchTargetName) { watchTargetComp = wit; break; }
      }
      if (!watchTargetComp) {
        $.global.HOLO_REGISTER_WATCH_RESULT = { ok: false };
      } else {
        var wFolder = watchTargetComp.parentFolder;
        registerWatch(watchTargetComp, wFolder ? wFolder.name : folderNameForComp(watchTargetComp));
        $.global.HOLO_REGISTER_WATCH_RESULT = { ok: true };
      }
    } catch (e) {
      $.global.HOLO_REGISTER_WATCH_RESULT = { ok: false, error: e.toString() };
    }
    return;
  }

  if ($.global.HOLO_NO_UI_TICK_WATCH) {
    // テスト用: scheduleTaskの発火を待たず、監視ロジックを即座に1回実行する
    try {
      if ($.global.holoStickerWatchTick) $.global.holoStickerWatchTick();
      $.global.HOLO_TICK_WATCH_RESULT = { ok: true };
    } catch (e) {
      $.global.HOLO_TICK_WATCH_RESULT = { ok: false, error: e.toString() };
    }
    return;
  }

  if ($.global.HOLO_NO_UI) {
    // テスト用: UIを介さず直接実行し、結果を$.globalに書き戻す(呼び出し側でtry/finally必須)
    try {
      // 本番のbtnOK.onClickと同様、モジュール起動時のINITIAL_ACTIVE_COMPではなく
      // ここで改めてアクティブコンポを取得する(手順の実装が一致することを保証する)。
      var testActiveComp = (app.project && app.project.activeItem instanceof CompItem)
        ? app.project.activeItem
        : null;
      if (!testActiveComp) {
        $.global.HOLO_TEST_RESULT = { error: "NO_ACTIVE_COMP" };
      } else {
        CREATED_ITEMS.length = 0;
        var testWidth = $.global.HOLO_TEST_WIDTH || CFG.width;
        var testHeight = $.global.HOLO_TEST_HEIGHT || CFG.height;
        var testTilesPerSide = $.global.HOLO_TEST_TILES_PER_SIDE || CFG.tilesPerSide;
        var testCreated = createHoloStickerComp(testWidth, testHeight, testActiveComp);
        var testComp = testCreated.comp;
        var testPlacedLayer = testCreated.placedLayer;
        var testTileComp = createTileComp(testComp, testTilesPerSide);
        var testTileLayer = placeTileIntoSticker(testComp, testTileComp);
        var testTilesLayer = createTilesParticleGrid(testComp, testTileLayer);
        addManualRotationControl(testPlacedLayer);
        linkHoloRotationToTile(testPlacedLayer, testTileComp, testActiveComp.name);
        var testFolderName = folderNameForComp(testComp);
        organizeCreatedItems(testComp, testFolderName);

        var gray50 = findLayerByName(testTileComp, "Neutral Gray 50%");
        var gray60 = findLayerByName(testTileComp, "Gray 60%");
        var noiseL = findLayerByName(testTileComp, "noise_001");
        var rL = findLayerByName(testTileComp, "R");
        var gL = findLayerByName(testTileComp, "G");
        var bL = findLayerByName(testTileComp, "B");
        var rotL = findLayerByName(testTileComp, "Rotation");

        function shiftVals(layer) {
          var fx = layer.property("ADBE Effect Parade").property("ADBE Shift Channels");
          return fx.property(2).value + "," + fx.property(3).value + "," + fx.property(4).value;
        }

        $.global.HOLO_TEST_RESULT = {
          compName: testComp.name,
          width: testComp.width,
          height: testComp.height,
          frameRate: testComp.frameRate,
          duration: testComp.duration,
          hostLayerCount: testActiveComp.numLayers,
          placedLayerName: testActiveComp.layer(1).name,
          holoStickerLayerCount: testComp.numLayers,

          tileName: testTileComp.name,
          tileWidth: testTileComp.width,
          tileHeight: testTileComp.height,
          tileFrameRate: testTileComp.frameRate,
          tileDuration: testTileComp.duration,
          tileLayerCount: testTileComp.numLayers,
          tileLayerInStickerEnabled: testTileLayer.enabled,
          tileLayerInStickerName: testTileLayer.name,
          tileLayerIndex: testTileLayer.index,

          folderName: testFolderName,
          createdItemCount: CREATED_ITEMS.length,

          gray50EffectCount: gray50.property("ADBE Effect Parade").numProperties,
          gray60Color: gray60.source.mainSource.color.toString(),
          blockDissolveTransitionCompletion: gray50.property("ADBE Effect Parade").property("ADBE Block Dissolve").property(1).value,
          blockDissolveWidth: gray50.property("ADBE Effect Parade").property("ADBE Block Dissolve").property(2).value,
          blockDissolveHeight: gray50.property("ADBE Effect Parade").property("ADBE Block Dissolve").property(3).value,
          blockDissolveFeather: gray50.property("ADBE Effect Parade").property("ADBE Block Dissolve").property(4).value,
          blockDissolveSoftEdges: gray50.property("ADBE Effect Parade").property("ADBE Block Dissolve").property(5).value,

          noiseLayerBlendingMode: noiseL.blendingMode,
          noiseLayerTimeRemapEnabled: noiseL.timeRemapEnabled,
          noiseLayerTimeRemapNumKeys: noiseL.property("ADBE Time Remapping").numKeys,
          noiseLayerRadialBlurAmount: noiseL.property("ADBE Effect Parade").property("ADBE Radial Blur").property("ADBE Radial Blur-0001").value,
          // noiseL.source参照で特定する(プロジェクト内を名前"noise_001"で検索すると、
          // 同名アイテムが複数存在しうるため取り違える恐れがある)
          noiseCompLayer1EffectName: noiseL.source.layer(1).property("ADBE Effect Parade").property(1).matchName,

          rExists: !!rL, gExists: !!gL, bExists: !!bL, rotationExists: !!rotL,
          rBlendingMode: rL.blendingMode,
          rEffectCount: rL.property("ADBE Effect Parade").numProperties,
          rShiftChannels: shiftVals(rL),
          rDirectionExpr: rL.property("ADBE Effect Parade").property("CC Light Sweep").property("CC Light Sweep-0002").expression,
          rRadialBlurAmount: rL.property("ADBE Effect Parade").property("ADBE Radial Blur").property("ADBE Radial Blur-0001").value,

          gShiftChannels: shiftVals(gL),
          gDirection: gL.property("ADBE Effect Parade").property("CC Light Sweep").property("CC Light Sweep-0002").value,
          gWidth: gL.property("ADBE Effect Parade").property("CC Light Sweep").property("CC Light Sweep-0004").value,
          gDirectionExpr: gL.property("ADBE Effect Parade").property("CC Light Sweep").property("CC Light Sweep-0002").expression,
          gRadialBlurAmount: gL.property("ADBE Effect Parade").property("ADBE Radial Blur").property("ADBE Radial Blur-0001").value,

          bShiftChannels: shiftVals(bL),
          bDirection: bL.property("ADBE Effect Parade").property("CC Light Sweep").property("CC Light Sweep-0002").value,
          bWidth: bL.property("ADBE Effect Parade").property("CC Light Sweep").property("CC Light Sweep-0004").value,
          bDirectionExpr: bL.property("ADBE Effect Parade").property("CC Light Sweep").property("CC Light Sweep-0002").expression,
          bRadialBlurAmount: bL.property("ADBE Effect Parade").property("ADBE Radial Blur").property("ADBE Radial Blur-0001").value,

          tilesLayerName: testTilesLayer.name,
          tilesEffectMatchName: testTilesLayer.property("ADBE Effect Parade").property(1).matchName,
          ppCannonPPS: testTilesLayer.property("ADBE Effect Parade").property("ADBE Playgnd").property("ADBE Playgnd-0103").value,
          ppCannonRadius: testTilesLayer.property("ADBE Effect Parade").property("ADBE Playgnd").property("ADBE Playgnd-0110").value,
          ppGravityForce: testTilesLayer.property("ADBE Effect Parade").property("ADBE Playgnd").property("ADBE Playgnd-0331").value,
          ppGridWidth: testTilesLayer.property("ADBE Effect Parade").property("ADBE Playgnd").property("ADBE Playgnd-0132").value,
          ppGridHeight: testTilesLayer.property("ADBE Effect Parade").property("ADBE Playgnd").property("ADBE Playgnd-0133").value,
          ppParticlesAcross: testTilesLayer.property("ADBE Effect Parade").property("ADBE Playgnd").property("ADBE Playgnd-0134").value,
          ppParticlesDown: testTilesLayer.property("ADBE Effect Parade").property("ADBE Playgnd").property("ADBE Playgnd-0135").value,
          ppGridRadiusNumKeys: testTilesLayer.property("ADBE Effect Parade").property("ADBE Playgnd").property("ADBE Playgnd-0136").numKeys,
          ppGridRadiusAtT0: testTilesLayer.property("ADBE Effect Parade").property("ADBE Playgnd").property("ADBE Playgnd-0136").valueAtTime(0, false),
          ppGridRadiusAtFrame1: testTilesLayer.property("ADBE Effect Parade").property("ADBE Playgnd").property("ADBE Playgnd-0136").valueAtTime(1 / testComp.frameRate, false),
          ppUseLayer: testTilesLayer.property("ADBE Effect Parade").property("ADBE Playgnd").property("ADBE Playgnd-0281").value,

          placedLayerThreeD: testPlacedLayer.threeDLayer,
          placedLayerName: testPlacedLayer.name,
          rotationNullExpr: findLayerByName(testTileComp, "Rotation").property("ADBE Transform Group").property("ADBE Rotate Z").expression,
          manualRotationEffectName: testPlacedLayer.property("ADBE Effect Parade").property(1).name,
          manualRotationEffectMatchName: testPlacedLayer.property("ADBE Effect Parade").property(1).matchName,

          folderChildCount: (function () {
            for (var i = 1; i <= app.project.numItems; i++) {
              var it = app.project.item(i);
              if (it instanceof FolderItem && it.name === testFolderName) return it.numItems;
            }
            return -1;
          })()
        };
      }
    } catch (e) {
      $.global.HOLO_TEST_RESULT = { error: e.toString() };
    }
    return;
  }

  if (!INITIAL_ACTIVE_COMP) {
    alert("holoSticker_AEhack: アクティブなコンポジションがありません。\n" +
      "holoSticker_001 を配置したいコンポジションを開いた状態で実行してください。\n\n" +
      "holoSticker_AEhack: There is no active composition.\n" +
      "Please open the composition you want to place holoSticker_001 into, then run again.");
    return;
  }

  buildUI(this);

})();
