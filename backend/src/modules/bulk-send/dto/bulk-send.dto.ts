import {
  IsString, IsOptional, IsArray, IsInt, IsNumber, IsIn, IsBoolean,
  Min, Max, MaxLength, ArrayMaxSize, ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

const ITEM_STATUSES = [
  'pending', 'fetching', 'ready', 'error', 'created', 'signed', 'sent',
] as const

class BulkItemDto {
  @IsString()
  @MaxLength(20)
  stir: string

  @IsOptional() @IsString() @MaxLength(500)
  name?: string

  @IsOptional() @IsString() @MaxLength(500)
  directorName?: string

  @IsOptional() @IsString() @MaxLength(500)
  address?: string

  @IsOptional() @IsString() @MaxLength(200)
  bankName?: string

  @IsOptional() @IsString() @MaxLength(50)
  bankAccount?: string

  @IsOptional() @IsString() @MaxLength(20)
  mfo?: string

  @IsOptional() @IsString() @MaxLength(50)
  contractNumber?: string

  @IsOptional() @IsNumber() @Min(0) @Max(1_000_000_000_000)
  amount?: number

  @IsOptional() @IsString() @MaxLength(500)
  productName?: string

  @IsOptional() @IsIn(ITEM_STATUSES)
  status?: typeof ITEM_STATUSES[number]

  @IsOptional() @IsString() @MaxLength(500)
  errorMessage?: string

  @IsOptional() @IsString() @MaxLength(50)
  contractId?: string
}

export class UpdateBulkDraftDto {
  @IsOptional() @IsInt() @Min(1) @Max(4)
  currentStep?: number

  @IsOptional() @IsString() @MaxLength(50)
  templateId?: string | null

  @IsOptional() @IsString() @MaxLength(50000)
  customContent?: string | null

  @IsOptional() @IsString() @MaxLength(50)
  contractType?: string

  @IsOptional() @IsNumber() @Min(0)
  defaultAmount?: number

  @IsOptional() @IsString() @MaxLength(500)
  defaultProductName?: string | null

  @IsOptional() @IsString() @MaxLength(100)
  city?: string

  @IsOptional() @IsIn(['manual', 'sequential'])
  numberingMode?: 'manual' | 'sequential'

  @IsOptional() @IsString() @MaxLength(50)
  startNumber?: string | null

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50, { message: "Maksimum 50 ta shartnoma" })
  @ValidateNested({ each: true })
  @Type(() => BulkItemDto)
  items?: BulkItemDto[]
}
