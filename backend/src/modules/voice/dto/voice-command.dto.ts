import {
  IsString, IsOptional, IsObject, IsIn, IsBoolean, MaxLength, ValidateNested, Matches,
} from 'class-validator'
import { Type } from 'class-transformer'

const ALLOWED_AUDIO_MIMES = [
  'audio/webm', 'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/ogg', 'audio/mp4', 'audio/mpeg',
]

class VoiceAudioDto {
  // Base64 encoded audio data — taxminan 8MB raw → ~10.7MB base64
  @IsString()
  @MaxLength(15_000_000, { message: "Audio juda katta (max ~10MB)" })
  data: string

  @IsString()
  @IsIn(ALLOWED_AUDIO_MIMES, { message: "Audio formati qo'llab-quvvatlanmaydi" })
  mimeType: string
}

export class VoiceCommandDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: "Buyruq juda uzun (max 2000 belgi)" })
  text?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => VoiceAudioDto)
  audio?: VoiceAudioDto

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/i, { message: "Tashkilot ID noto'g'ri" })
  orgId?: string

  @IsOptional()
  @IsIn(['uz', 'oz', 'ru'])
  targetLang?: 'uz' | 'oz' | 'ru'

  // ConversationState — opaque object frontend tomondan keladi
  @IsOptional()
  @IsObject()
  state?: Record<string, any> | null

  // Test rejimi — tool'larni bajarmasdan faqat LLM javobini qaytaradi
  @IsOptional()
  @IsBoolean()
  testMode?: boolean
}
