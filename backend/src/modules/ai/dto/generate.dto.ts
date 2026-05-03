import {
  IsString, IsOptional, IsObject, IsIn, MinLength, MaxLength,
} from 'class-validator'

const TARGET_LANGS = ['uz', 'oz', 'ru'] as const

export class GenerateAiDocDto {
  @IsString()
  @MinLength(1, { message: "Tashkilot ID kerak" })
  orgId: string

  @IsString()
  @MinLength(1, { message: "Hujjat turi tanlanmagan" })
  @MaxLength(64)
  docType: string

  @IsString()
  @MinLength(3,    { message: "So'rov juda qisqa" })
  @MaxLength(8000, { message: "So'rov juda uzun (max 8000 belgi)" })
  prompt: string

  @IsOptional()
  @IsObject()
  orgData?: Record<string, string>

  @IsOptional()
  @IsObject()
  cpData?: Record<string, string>

  @IsOptional()
  @IsIn(TARGET_LANGS)
  targetLang?: 'uz' | 'oz' | 'ru'
}
