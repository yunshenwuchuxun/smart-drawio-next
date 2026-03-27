'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import ImageUpload from './ImageUpload';
import ChatTabBar from './chat/ChatTabBar';
import FileUploadPanel from './chat/FileUploadPanel';
import TextInputPanel from './chat/TextInputPanel';
import {
  buildImageGenerationPayload,
  createEmptyFileState,
  FILE_STATUS,
  readTextFile,
  validateTextFileSelection,
} from '@/lib/chat-panel-utils';
import { getAllThemes } from '@/lib/themes';

export default function Chat({
  onSendMessage,
  isGenerating,
  initialInput = '',
  initialChartType = 'auto',
  theme = 'research',
  onThemeChange,
  onStop,
}) {
  const [activeTab, setActiveTab] = useState('text');
  const [input, setInput] = useState(initialInput);
  const [chartType, setChartType] = useState(initialChartType);
  const [fileState, setFileState] = useState(createEmptyFileState);
  const [selectedImage, setSelectedImage] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const themes = useMemo(() => getAllThemes(), []);

  useEffect(() => {
    setInput(initialInput);
  }, [initialInput]);

  useEffect(() => {
    setChartType(initialChartType);
  }, [initialChartType]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!input.trim() || isGenerating) {
      return;
    }

    onSendMessage(input.trim(), chartType);
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    if (event.ctrlKey || event.metaKey || !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setFileState(createEmptyFileState());
      return;
    }

    const validation = validateTextFileSelection(file);
    if (!validation.isValid) {
      setFileState({
        file,
        status: FILE_STATUS.ERROR,
        error: validation.error,
        content: '',
      });
      return;
    }

    setFileState({
      file,
      status: FILE_STATUS.PARSING,
      error: '',
      content: '',
    });

    try {
      const content = await readTextFile(file);
      setFileState({
        file,
        status: FILE_STATUS.SUCCESS,
        error: '',
        content,
      });
    } catch (error) {
      setFileState({
        file,
        status: FILE_STATUS.ERROR,
        error: error.message,
        content: '',
      });
    }
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileGenerate = () => {
    if (!fileState.content || isGenerating) {
      return;
    }

    onSendMessage(fileState.content, chartType);
  };

  const handleImageSubmit = () => {
    if (isGenerating) {
      return;
    }

    const payload = buildImageGenerationPayload(selectedImage, chartType);
    if (payload) {
      onSendMessage(payload, chartType);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-t border-gray-200">
      <ChatTabBar activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex-1 flex flex-col">
        {activeTab === 'text' ? (
          <TextInputPanel
            chartType={chartType}
            input={input}
            isGenerating={isGenerating}
            onChartTypeChange={setChartType}
            onInputChange={setInput}
            onKeyDown={handleKeyDown}
            onStop={onStop}
            onSubmit={handleSubmit}
            onThemeChange={onThemeChange}
            textareaRef={textareaRef}
            theme={theme}
            themes={themes}
          />
        ) : null}

        {activeTab === 'file' ? (
          <FileUploadPanel
            chartType={chartType}
            fileInputRef={fileInputRef}
            fileState={fileState}
            isGenerating={isGenerating}
            onChartTypeChange={setChartType}
            onFileChange={handleFileChange}
            onGenerate={handleFileGenerate}
            onOpenFilePicker={handleOpenFilePicker}
            onStop={onStop}
            onThemeChange={onThemeChange}
            theme={theme}
            themes={themes}
          />
        ) : null}

        {activeTab === 'image' ? (
          <div className="flex-1 flex flex-col relative">
            <ImageUpload
              onImageSelect={setSelectedImage}
              isGenerating={isGenerating}
              chartType={chartType}
              onChartTypeChange={setChartType}
              onImageGenerate={handleImageSubmit}
              onStop={onStop}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}