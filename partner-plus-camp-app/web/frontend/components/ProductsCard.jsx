// reactライブラリからuseStateモジュールを読み込む
import { useState } from "react";
// Polarisの読み込み
import { Card, TextContainer, Text } from "@shopify/polaris";
// app-bridgeからtoast(ポップアップメッセージ)の読み込み
import { Toast } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
// API通信を行うためのモジュールを読み込む
import { useAppQuery, useAuthenticatedFetch } from "../hooks";

//ProductsCardメイン処理
export function ProductsCard() {
  // toastPropsに設定する初期値:null
  const emptyToastProps = { content: null };
  // const [状態変数, 状態を変更するための関数] = useState(状態の初期値);
  const [isLoading, setIsLoading] = useState(true);
  const [toastProps, setToastProps] = useState(emptyToastProps);
  // OAuth(認証処理)
  const fetch = useAuthenticatedFetch();
  const { t } = useTranslation();
  const productsCount = 5;
  // RestAPIで商品数を取得
  const {
    data, // APIから取得したデータが入る
    refetch: refetchProductCount, // データの再取得
    isLoading: isLoadingCount, // 初期ロードの状態(取得完了：false)
    isRefetching: isRefetchingCount, // 再取得中の状態(進行中： true)
  } = useAppQuery({
    url: "/api/products/count",
    reactQueryOptions: {
      onSuccess: () => {
        // ローディングマークを非表示
        setIsLoading(false);
      },
    },
  });
  // ポップアップメッセージの表示処理
  const toastMarkup = toastProps.content && !isRefetchingCount && (
    <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
  );
  // Populate 5 productsボタンがクリックされると実行される処理
  const handlePopulate = async () => {
    // ローディングマークを表示
    setIsLoading(true);
    // APIにリクエスト
    const response = await fetch("/api/products/create");
    // 商品追加の成功がAPIから帰ってきた時
    if (response.ok) {
      // 商品数表示の更新
      await refetchProductCount();
      // ポップアップメッセージ
      setToastProps({
        content: t("ProductsCard.productsCreatedToast", {
          count: productsCount,
        }),
      });
    // 失敗した時
    } else {
      // ローディングマークを非表示
      setIsLoading(false);
      // ポップアップメッセージ
      setToastProps({
        content: t("ProductsCard.errorCreatingProductsToast"),
        error: true,
      });
    }
  };
　// Populate 5 productsボタンをクリックするとhandlePopulate関数が実行されるisLoadingがTrueなら、ローディングマークを表示
  return (
    <>
      {toastMarkup}
      <Card
        title={t("ProductsCard.title")}
        sectioned
        primaryFooterAction={{
          content: t("ProductsCard.populateProductsButton", {
            count: productsCount,
          }),
          onAction: handlePopulate,
          loading: isLoading,
        }}
      >
        <TextContainer spacing="loose">
          <p>{t("ProductsCard.description")}</p>
          <Text as="h4" variant="headingMd">
            {t("ProductsCard.totalProductsHeading")}
            <Text variant="bodyMd" as="p" fontWeight="semibold">
              {/* isLoadingCountがFalseの場合（データの受信が完了している場合）商品数を表示します */}
              {isLoadingCount ? "-" : data.count}
            </Text>
          </Text>
        </TextContainer>
      </Card>
    </>
  );
}
