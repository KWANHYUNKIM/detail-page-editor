import { create } from 'zustand';
import { createUiSlice, type UiSlice } from './slices/uiSlice';
import { createProjectSlice, type ProjectSlice } from './slices/projectSlice';
import { createElementSlice, type ElementSlice } from './slices/elementSlice';
import { createLayerSlice, type LayerSlice } from './slices/layerSlice';
import { createFrameSlice, type FrameSlice } from './slices/frameSlice';
import { createAlignmentSlice, type AlignmentSlice } from './slices/alignmentSlice';

export type EditorState = UiSlice & ProjectSlice & ElementSlice & LayerSlice & FrameSlice & AlignmentSlice;

export const useEditorStore = create<EditorState>((set, get) => ({
  ...createUiSlice(set, get),
  ...createProjectSlice(set, get),
  ...createElementSlice(set, get),
  ...createLayerSlice(set, get),
  ...createFrameSlice(set, get),
  ...createAlignmentSlice(set, get),
}));
