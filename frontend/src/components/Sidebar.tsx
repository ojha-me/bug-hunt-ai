import { useState } from "react";
import { Button, Drawer, Stack, ScrollArea, Box, Modal, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaAnglesRight, FaPlus } from "react-icons/fa6";

export const Sidebar = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [openedNewConversation, { open: openNewConversation, close: closeNewConversation }] = useDisclosure(false);

  const [title, setTitle] = useState("");



  return (
    <>
      <Drawer opened={opened} onClose={close} size={300} padding="md" title="BugHunt" closeOnClickOutside={false}>
        <Stack className="h-full">
          <Box mb="sm">
            <Button variant="default" onClick={openNewConversation} fullWidth leftSection={<FaPlus />}>
              New Conversation
            </Button>
          </Box>

          <Box style={{ flex: 1, overflow: "hidden" }}>
            <ScrollArea style={{ height: "100%" }}>
              <Stack>
                {conversations.map((conv, index) => (
                  <Box key={index} p="sm" className="border-b border-gray-200">
                {conv}
                  </Box>
                ))}
              </Stack>
            </ScrollArea>
          </Box>
        </Stack>
      </Drawer>

      <Button
        variant="default"
        style={{ height: "100vh", position: "fixed", left: 0, top: 0 }}
        onClick={opened ? close : open}
      >
        {!opened && <FaAnglesRight size={24} />}
      </Button>

      <Modal opened={openedNewConversation} onClose={closeNewConversation} title="New Conversation">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Title"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              required
            />
            <Button type="submit" fullWidth>
              Create
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
};
