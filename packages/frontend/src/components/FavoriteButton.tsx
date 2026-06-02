import React from 'react'
import { Heart } from 'lucide-react'

interface Props {
  isFavorited: boolean
  onSave: () => void
  onRemove: () => void
}

export const FavoriteButton: React.FC<Props> = ({ isFavorited, onSave, onRemove }) => (
  <button
    onClick={isFavorited ? onRemove : onSave}
    aria-label={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
    className={`p-1.5 rounded-full transition-colors ${isFavorited ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-red-400 hover:bg-gray-50'}`}
  >
    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
  </button>
)
