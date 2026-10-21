
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { SIZE_SURCHARGE, TOPPING_PRICE } from '../pricing';

export class CreateOrderItemDto {
  @IsInt()
  @Min(1)
  @Max(2147483647)
  productId!: number;

  @IsIn(Object.keys(SIZE_SURCHARGE))
  size!: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  qty!: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayUnique()
  @IsIn(Object.keys(TOPPING_PRICE), { each: true })
  toppings?: string[];
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
