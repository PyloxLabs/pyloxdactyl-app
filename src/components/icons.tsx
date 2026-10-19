import { type ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color: string;
};

const STROKE = 1.7;

type IconComponent = (props: IconProps) => ReactNode;

function createIcon(name: string, paths: (color: string) => ReactNode): IconComponent {
  const Icon = ({ size = 22, color }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {paths(color)}
    </Svg>
  );
  Icon.displayName = name;
  return Icon;
}

export const FolderIcon = createIcon('FolderIcon', (color) => (
  <Path
    d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.379a2 2 0 0 1 1.414.586l1.121 1.121a1 1 0 0 0 .707.293H18.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z"
    stroke={color}
    strokeWidth={STROKE}
    strokeLinecap="round"
    strokeLinejoin="round"
    fill={color}
    fillOpacity={0.16}
  />
));

export const FileIcon = createIcon('FileIcon', (color) => (
  <>
    <Path
      d="M6 3.75A1.75 1.75 0 0 1 7.75 2h5.816a2 2 0 0 1 1.414.586l3.434 3.434A2 2 0 0 1 19 7.434V20.25A1.75 1.75 0 0 1 17.25 22h-9.5A1.75 1.75 0 0 1 6 20.25z"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.16}
    />
    <Path d="M13.5 2.5v4a1.5 1.5 0 0 0 1.5 1.5h4" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
    <Path d="M9 13h6M9 16.5h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </>
));

export const SendIcon = createIcon('SendIcon', (color) => (
  <Path
    d="M20.4 3.6 3.9 10.1c-.9.34-.86 1.6.05 1.9l6.03 1.98 1.98 6.03c.3.91 1.56.95 1.9.05z"
    stroke={color}
    strokeWidth={STROKE}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
));

export const PlayIcon = createIcon('PlayIcon', (color) => (
  <Path
    d="M7.5 4.66c0-.83.9-1.34 1.61-.92l10.1 5.98a1.07 1.07 0 0 1 0 1.84l-10.1 5.98c-.71.42-1.61-.09-1.61-.92z"
    stroke={color}
    strokeWidth={STROKE}
    strokeLinejoin="round"
    fill={color}
    fillOpacity={0.16}
  />
));

export const RestartIcon = createIcon('RestartIcon', (color) => (
  <>
    <Path d="M20.2 12a8.2 8.2 0 1 1-2.53-5.92" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    <Path d="M20.4 3.8v4.9h-4.9" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
  </>
));

export const StopIcon = createIcon('StopIcon', (color) => (
  <Rect
    x={6}
    y={6}
    width={12}
    height={12}
    rx={2.4}
    stroke={color}
    strokeWidth={STROKE}
    strokeLinejoin="round"
    fill={color}
    fillOpacity={0.16}
  />
));

export const PowerIcon = createIcon('PowerIcon', (color) => (
  <>
    <Path d="M12 3.2v7.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    <Path d="M7.05 6.4a7 7 0 1 0 9.9 0" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
  </>
));

export const FolderPlusIcon = createIcon('FolderPlusIcon', (color) => (
  <>
    <Path
      d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.379a2 2 0 0 1 1.414.586l1.121 1.121a1 1 0 0 0 .707.293H18.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.16}
    />
    <Path d="M12 10.6v5M9.5 13.1h5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
  </>
));

export const SaveIcon = createIcon('SaveIcon', (color) => (
  <>
    <Path
      d="M4.75 4h10.3a1.6 1.6 0 0 1 1.13.47l3.35 3.35a1.6 1.6 0 0 1 .47 1.13v10.3A1.75 1.75 0 0 1 18.25 21H5.75A1.75 1.75 0 0 1 4 19.25V5.75A1.75 1.75 0 0 1 5.75 4Z"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.16}
    />
    <Path d="M8 4v5h6.5V4M8.5 20v-5.5h7V20" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
  </>
));

export const UserPlusIcon = createIcon('UserPlusIcon', (color) => (
  <>
    <Circle cx={10} cy={8} r={3.4} stroke={color} strokeWidth={STROKE} />
    <Path d="M3.8 20.2a6.4 6.4 0 0 1 12.4 0" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    <Path d="M18.2 8.4v5M15.7 10.9h5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
  </>
));

export const EyeIcon = createIcon('EyeIcon', (color) => (
  <>
    <Path
      d="M2.6 12S6 6.2 12 6.2 21.4 12 21.4 12 18 17.8 12 17.8 2.6 12 2.6 12Z"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={12} r={2.9} stroke={color} strokeWidth={STROKE} />
  </>
));

export const EyeOffIcon = createIcon('EyeOffIcon', (color) => (
  <>
    <Path
      d="M4.3 8.1C3.2 9.3 2.6 12 2.6 12s3.4 5.8 9.4 5.8c1.3 0 2.5-.3 3.5-.7"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.3 6.6c.86-.26 1.78-.4 2.7-.4 6 0 9.4 5.8 9.4 5.8s-.9 1.5-2.5 2.9"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    <Path d="M3.6 3.6l16.8 16.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
  </>
));

export const CopyIcon = createIcon('CopyIcon', (color) => (
  <>
    <Rect
      x={9}
      y={9}
      width={11}
      height={11}
      rx={2.2}
      stroke={color}
      strokeWidth={STROKE}
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.16}
    />
    <Path d="M15 9V6.2A2.2 2.2 0 0 0 12.8 4H6.2A2.2 2.2 0 0 0 4 6.2v6.6A2.2 2.2 0 0 0 6.2 15H9" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
  </>
));

export const RefreshIcon = createIcon('RefreshIcon', (color) => (
  <>
    <Path d="M20.2 12a8.2 8.2 0 1 1-2.53-5.92" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    <Path d="M20.4 3.8v4.9h-4.9" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
  </>
));

export const PencilIcon = createIcon('PencilIcon', (color) => (
  <>
    <Path
      d="M4 20.2h4l10.6-10.6a2.1 2.1 0 0 0 0-3l-1-1a2.1 2.1 0 0 0-3 0L4 16.2z"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.16}
    />
    <Path d="M14.6 5.6l3.8 3.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
  </>
));

export const TrashIcon = createIcon('TrashIcon', (color) => (
  <>
    <Path
      d="M5.5 7h13l-.8 11.4a1.9 1.9 0 0 1-1.9 1.6H8.2a1.9 1.9 0 0 1-1.9-1.6z"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.16}
    />
    <Path d="M3.8 7h16.4M9.5 7V5.4A1.4 1.4 0 0 1 10.9 4h2.2a1.4 1.4 0 0 1 1.4 1.4V7" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10.4 10.6v5.6M13.6 10.6v5.6" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
  </>
));

export const ExternalLinkIcon = createIcon('ExternalLinkIcon', (color) => (
  <>
    <Path
      d="M14 4h6v6l-4.2-4.2z"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinejoin="round"
    />
    <Path d="M20 4l-8.4 8.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    <Path
      d="M18.4 14.2v4.4A1.4 1.4 0 0 1 17 20H5.4A1.4 1.4 0 0 1 4 18.6V7a1.4 1.4 0 0 1 1.4-1.4h4.4"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>
));

export const ServerIcon = createIcon('ServerIcon', (color) => (
  <>
    <Rect x={3.4} y={4} width={17.2} height={6.4} rx={1.9} stroke={color} strokeWidth={STROKE} fill={color} fillOpacity={0.16} />
    <Rect x={3.4} y={13.6} width={17.2} height={6.4} rx={1.9} stroke={color} strokeWidth={STROKE} fill={color} fillOpacity={0.16} />
    <Path d="M7 7.2h.01M7 16.8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M11 7.2h4M11 16.8h4" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
  </>
));

export const HardDriveIcon = createIcon('HardDriveIcon', (color) => (
  <>
    <Path
      d="M3 13.2h18v4.6A2.2 2.2 0 0 1 18.8 20H5.2A2.2 2.2 0 0 1 3 17.8z"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.16}
    />
    <Path d="M5.6 13.2 8 5.4A2 2 0 0 1 9.9 4h4.2a2 2 0 0 1 1.9 1.4l2.4 7.8" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
    <Path d="M6.6 16.6h.01M17.4 16.6h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </>
));

export const PlusIcon = createIcon('PlusIcon', (color) => (
  <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
));

export const GearIcon = createIcon('GearIcon', (color) => (
  <>
    <Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={STROKE} />
    <Path
      d="M19.5 14.2a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56v.17a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H4a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 5.65 8.1a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 8.08 3.34l.06.06a1.7 1.7 0 0 0 1.87.34H10a1.7 1.7 0 0 0 1.03-1.56V2a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V8a1.7 1.7 0 0 0 1.56 1.03H22a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.03z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  </>
));

export const MapPinIcon = createIcon('MapPinIcon', (color) => (
  <>
    <Path
      d="M12 21s6.6-5.2 6.6-10.4A6.6 6.6 0 0 0 5.4 10.6C5.4 15.8 12 21 12 21Z"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.16}
    />
    <Circle cx={12} cy={10.4} r={2.4} stroke={color} strokeWidth={STROKE} />
  </>
));

export const LayersIcon = createIcon('LayersIcon', (color) => (
  <>
    <Path
      d="M12 3.6 3.8 8 12 12.4 20.2 8z"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.16}
    />
    <Path d="M3.8 12.4 12 16.8l8.2-4.4M3.8 16.6 12 21l8.2-4.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
  </>
));

export const EggIcon = createIcon('EggIcon', (color) => (
  <Path
    d="M12 3.2c3.3 0 6.4 5.4 6.4 9.7a6.4 6.4 0 0 1-12.8 0c0-4.3 3.1-9.7 6.4-9.7Z"
    stroke={color}
    strokeWidth={STROKE}
    strokeLinejoin="round"
    fill={color}
    fillOpacity={0.16}
  />
));

export const UploadIcon = createIcon('UploadIcon', (color) => (
  <>
    <Path d="M12 15.6V4.4M8.2 8.2 12 4.4l3.8 3.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M5 14.6v3.8A1.8 1.8 0 0 0 6.8 20h10.4a1.8 1.8 0 0 0 1.8-1.6v-3.8"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>
));

