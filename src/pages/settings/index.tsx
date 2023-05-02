import { useRootStore } from "@/stores/root.store";
import { Button, Checkbox, Col, Form, Input, Row, Space } from "antd";
import { useEffect } from "react";
import { shallow } from "zustand/shallow";

import { Typography } from "antd";

const { Title } = Typography;

const onFinish = (values: any) => {
  console.log("Success:", values);
};

const onFinishFailed = (errorInfo: any) => {
  console.log("Failed:", errorInfo);
};

export default function SettingsPage() {
  const [activateTabId, toSettingsTab] = useRootStore(
    (rootStore) => rootStore.mainLayout,
    (state) => [state.activateTabId, state.toSettingsTab],
    shallow
  );

  useEffect(() => {
    if (activateTabId) {
      toSettingsTab(activateTabId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [settings, setSettings] = useRootStore(
    (rootStore) => rootStore.settings,
    (state) => [state.settings, state.setSettings],
    shallow
  );

  const handleFinish = (value: any) => {
    setSettings(value);
  };

  const [form] = Form.useForm<any>();

  useEffect(() => {
    if (settings) {
      form.setFieldsValue(settings);
    }
  }, [settings]);

  return (
    <main className="p-8">
      <Form
        name="settings"
        form={form}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ azureDevOps: {} }}
        onFinish={handleFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Title level={2}>Azure DevOps</Title>
        <Form.Item label="Organization" name={["azureDevOps", "organization"]}>
          <Input />
        </Form.Item>

        <Form.Item label="Project" name={["azureDevOps", "project"]}>
          <Input />
        </Form.Item>

        <Form.Item label="Access Token" name={["azureDevOps", "accessToken"]}>
          <Input />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </Form.Item>
      </Form>
    </main>
  );
}
