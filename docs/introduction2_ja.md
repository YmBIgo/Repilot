# 【K8sのソースコードをLLMで読もう！】Go言語を読む専用のVSCode拡張作りました

## tldr;

１： LLMにGo言語のコードを読ませるVS Code 拡張機能 Repilot を作りました

https://marketplace.visualstudio.com/items?itemName=coffeecupjapan.repilot&ssr=false#overview

https://github.com/YmBIgo/Repilot

２： CNCFのGo言語プロジェクト（Kubernetes, argo-cdなど）で、関数を見つけ出すことで挫折をする事は無くなった
３： LLMに重要な関数候補を出してもらい、関数の中身をLLMに渡す、という流れを再帰的に続ける仕組み

## 導入

エンジニアになったからには、絶対挑戦したい事はありますか？

- 自作OS
- 自作DB
- 大規模OSS貢献
- ITビジネス立ち上げ
- AIエージェント開発 ...

様々なことがあると思います。
その多くの挑戦で必要になってくる力が「コード読解力」です。
ただ有名なOSSのようにコードが大規模になればなるほど、コードを読むのはしんどくなります...

- 単純にコードが多すぎてつまらない
- どの関数が重要か分からない
- 深くまで探索した関数が間違っていたが、元の関数に戻るのがしんどい

そんな悩みを自分も抱えてい、せっかくたくさんあるOSSを一部しか読めないことを残念に思っていたので、プログラミングの読解を簡単にするVSCode拡張を作ってみました（一旦Go言語限定）。

https://marketplace.visualstudio.com/items?itemName=coffeecupjapan.repilot&ssr=false#overview

関連記事↓

https://zenn.dev/coffeecupjp/articles/89bb2b40ced6eb

この記事は、私が作ったLLMを使ったプログラミングの読解に特化したVSCode拡張を使って、k8sのコードを読んでみようというハンズオン形式の記事になります。

***「大規模コードを読むのは、自分には無理...」***

そう思ったあなたでも大丈夫です。
このVSCode拡張を使えば、***LLMがコードを読んでくれます***。なのであなたがコードを読む必要はありません。あなたがすべきなのは、LLMが読む経路が間違った方向に行かないように制御するだけです。

興味があったら、一読ください。

## 対象読者

- 大規模OSSの読解に興味があるが、憧れのままだった人
- CNCFの新旧プロジェクトであるk8sなどのOSS貢献したいが、難しくて挫折した人
- AIエージェントの実装に興味がある人

## なぜ作ったか？

ちょうど半年くらい前の2024年9~10月に、個人的に Kubernetes 周りの技術に凝っていた時期があって、Kuberenetes のオープンソースの Go言語のコードを読んでいた頃がありました。

ただ読めば読むほど、kubectlやetcdとの接続に留まらない、Kubenetesの奥深さに絶望するだけでした。具体的には、kube-scheduler, kubelet, kube-aggregator から Kubeneretesの周辺機能である様々な CNCF のプロジェクト...と、自分一人の個人の力ではとても全て追うのは不可能だと思っていました。

---

時は経って、2025年。
LLMについて研究をしていたときに、vulnhuntr というLLMを使ったセキュリティスキャンツールを見つけました。

https://github.com/protectai/vulnhuntr

vulnhuntr のコアの実装は

1. LLMにセキュリティ的に***不審な箇所候補***をいくつか挙げてもらう
2. LSPで関数ジャンプして関数の中身を取得
3. 1〜2を繰り返す

のようになっているのですが、これを、大規模コードリーディングにも使えるのではないかと考えたのが今回のようなツールを作ったきっかけです。

つまり、vulnhuntr を少し改善して、

1. LLMに読んでもらうエントリポイントの関数とコードリーディングの目的を入力
2. 1の情報を元に、LLMにエントリーポイントの関数から関数の全体を取得し、入力された目的とあう***関数の候補を取得***
3. ユーザーにジャンプした関数を選んでもらい、LSPで候補関数にジャンプし再度関数の中身を取得
4. 2〜3を繰り返す

のように実装できると思ったのです。
そこで、CLIツールを開発したり、

https://zenn.dev/coffeecupjp/articles/89bb2b40ced6eb

これの VSCode拡張版を作ったりしました。

https://marketplace.visualstudio.com/items?itemName=coffeecupjapan.repilot&ssr=false#overview

https://github.com/YmBIgo/Repilot

実際に このツールを使って、今では Kubenetes の難しそうだった、***scheduler や kubelet の機能の大枠の重要な関数をざっくり理解できるようになり、argo-cd や prometheus でもコードの理解の役に立つ情報をコスパよく見れていると思います。***

まぁ、自己語りはここまでにして、どのようにしてこのVSCode拡張 Repilot を使って k8s を読んでいくかを説明していきます。

## k8sを読んでみよう！Repilotを使ったコードリーディング

では早速、k8sをLLMを使って読んでみましょう！
まずは準備からです。

０：まずは以下を用意する必要があるので、用意していただきます。

- k8sのコードベース

```bash
git clone https://github.com/kubernetes/kubernetes.git
```

- ClaudeのAPI Key

申し訳ないですが、OpenAI, Gemini などには対応していません。
自分で Claude のAPI Keyを取得してみてください（ちなみにAPIが不安定なので、3.5 sonnetを使っています）。

- gopls

```bash
brew install gopls
which gopls # /opt/homebrew/bin/gopls
```

- repilot

VSCode拡張検索で、repilotと調べれば出てきます。
使う時は「Command + Shift + p」でコマンドパレットを表示し、「repilot」を検索すれば出てきます。

![Repilot検索結果](https://qiita-user-contents.imgix.net/https%3A%2F%2Fqiita-image-store.s3.ap-northeast-1.amazonaws.com%2F0%2F92647%2Fa53f1cb5-ad17-4034-8d08-00554f687e06.png?ixlib=rb-4.0.0&auto=format&gif-q=60&q=75&w=1400&fit=max&s=2b9f8ea995e64ab021f973787612f84e)

１：k8sのエントリーポイントを探す

いきなりですが、これが一番難しいですよね。
一応アーキテクチャは、以下のようになっているそうです。

![Kubernetesのアーキテクチャ](https://kubernetes.io/images/docs/components-of-kubernetes.svg)

https://kubernetes.io/ja/docs/concepts/overview/components/

左の方がコントロールプレーンという「状態保存（etcd）やNodeへの操作を指示（api-server）やNodeの割り当ての優先順位付け（kube-scheduler）などの操作を担当」、右の方が「実際のコンテナを実行（kubeletがcriを実行）を担当」する構成になっています。

ここら辺のエントリーポイントは、以下にまとめたのでよかったらみてみて下さい。

::::details エントリーポイントまとめ（主要なもののみ）
:::message
- kubectlのコマンド登録：staging/src/k8s.io/kubectl/pkg/cmd/cmd.go　のNewDefaultKubectlCommand
- api-serverのコマンド登録：cmd/kube-apiserver/app/server.go　のNewAPIServerCommand
- api-server：pkg/controlplane/instance.go　のNew
- kube-schedulerのコマンド登録：kubernetes/cmd/kube-scheduler/app/server.go　の- NewSchedulerCommand
- kube-schedulerの初期化：kubernetes/pkg/scheduler/scheduler.go　の New
- kubeletのコマンド登録：kubernetes/cmd/kubelet/app/server.go　の NewKubeletCommand
- kubeletの初期化：kubernetes/pkg/kubelet/kubelet.go　の NewMainKubelet
:::
::::

ここでは、一番フロント寄りの kubectl を今回のrepilotで見てみましょう！
kubectl の

０：