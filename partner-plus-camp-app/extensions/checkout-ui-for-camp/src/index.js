import {
  extend,
  ChoiceList,
  Choice,
  BlockStack,
  InlineStack,
} from '@shopify/checkout-ui-extensions';
extend('Checkout::Dynamic::Render', (root) => {
  const choiceList = root.createComponent(
    ChoiceList,
    {
      name: 'choice',
      value: 'first',
      onChange: (value) => {
        console.log(`onChange event with value: ${value}`);
      },
    },
    [
      root.createComponent(BlockStack, undefined, [
        root.createComponent(Choice, {id: 'first'}, 'Camp課題8：1'),
        root.createComponent(Choice, {id: 'second'}, 'Camp課題8：2'),
      ]),
    ],
  );

  const multipleChoiceList = root.createComponent(
    ChoiceList,
    {
      name: 'multipleChoice',
      value: ['multipleFirst'],
      onChange: (value) => {
        console.log(`onChange event with value: ${value}`);
      },
    },
    [
      root.createComponent(BlockStack, undefined, [
        root.createComponent(Choice, {id: 'multipleFirst'}, 'おめでとうございます'),
        root.createComponent(Choice, {id: 'multipleSecond'}, 'ありがとうございます'),
      ]),
    ],
  );

  const layout = root.createComponent(InlineStack, undefined, [
    choiceList,
    multipleChoiceList,
  ]);

  root.appendChild(layout);
});