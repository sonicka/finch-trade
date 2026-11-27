import { FC } from 'react';
import { Color } from '../types';
import { getColorName, getColorSwatchStyle } from '../utils';

interface Props {
  colors: Color[];
  colorId: number;
}

const ColorCircle: FC<Props> = ({ colors, colorId }) => {
  return (
    <div
      className="w-6 h-6 ml-2 mr-2 rounded-full object-cover border border-black"
      style={getColorSwatchStyle(getColorName(colors, colorId))}
    />
  );
};

export default ColorCircle;
