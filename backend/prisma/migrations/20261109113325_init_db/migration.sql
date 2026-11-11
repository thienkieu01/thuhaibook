-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateTable
CREATE TABLE "Users" (
    "UserID" TEXT NOT NULL,
    "Username" TEXT NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Phone" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "Avatar" TEXT,
    "Role" TEXT NOT NULL DEFAULT 'USER',
    "Status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("UserID")
);

-- CreateTable
CREATE TABLE "AddressesCustomer" (
    "UserID" TEXT NOT NULL,
    "Address" TEXT NOT NULL,

    CONSTRAINT "AddressesCustomer_pkey" PRIMARY KEY ("UserID","Address")
);

-- CreateTable
CREATE TABLE "Categories" (
    "CategoryID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("CategoryID")
);

-- CreateTable
CREATE TABLE "Authors" (
    "AuthorID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,

    CONSTRAINT "Authors_pkey" PRIMARY KEY ("AuthorID")
);

-- CreateTable
CREATE TABLE "Publishers" (
    "PublisherID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,

    CONSTRAINT "Publishers_pkey" PRIMARY KEY ("PublisherID")
);

-- CreateTable
CREATE TABLE "Books" (
    "BookID" TEXT NOT NULL,
    "PublisherID" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "AgeGroup" TEXT,
    "Description" TEXT,
    "CoverImage" TEXT,
    "Status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "IsRecommended" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Books_pkey" PRIMARY KEY ("BookID")
);

-- CreateTable
CREATE TABLE "BookAuthors" (
    "BookID" TEXT NOT NULL,
    "AuthorID" TEXT NOT NULL,

    CONSTRAINT "BookAuthors_pkey" PRIMARY KEY ("BookID","AuthorID")
);

-- CreateTable
CREATE TABLE "BookCategories" (
    "BookID" TEXT NOT NULL,
    "CategoryID" TEXT NOT NULL,

    CONSTRAINT "BookCategories_pkey" PRIMARY KEY ("BookID","CategoryID")
);

-- CreateTable
CREATE TABLE "BookCopies" (
    "CopyID" TEXT NOT NULL,
    "BookID" TEXT NOT NULL,
    "ConditionPercent" INTEGER NOT NULL,
    "DamageDescription" TEXT,
    "Price" DECIMAL(12,2) NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookCopies_pkey" PRIMARY KEY ("CopyID")
);

-- CreateTable
CREATE TABLE "ImagesBookCopies" (
    "CopyID" TEXT NOT NULL,
    "ImageUrl" TEXT NOT NULL,

    CONSTRAINT "ImagesBookCopies_pkey" PRIMARY KEY ("CopyID","ImageUrl")
);

-- CreateTable
CREATE TABLE "Services" (
    "ServiceID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Price" DECIMAL(12,2) NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Services_pkey" PRIMARY KEY ("ServiceID")
);

-- CreateTable
CREATE TABLE "Orders" (
    "OrderID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "OrderCode" TEXT NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'PENDING',
    "TotalAmount" DECIMAL(12,2) NOT NULL,
    "Date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Time" TIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("OrderID")
);

-- CreateTable
CREATE TABLE "OrderBookCopies" (
    "OrderID" TEXT NOT NULL,
    "CopyID" TEXT NOT NULL,
    "PriceAtOrder" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OrderBookCopies_pkey" PRIMARY KEY ("OrderID","CopyID")
);

-- CreateTable
CREATE TABLE "OrderCopyServices" (
    "OrderID" TEXT NOT NULL,
    "CopyID" TEXT NOT NULL,
    "ServiceID" TEXT NOT NULL,
    "PriceAtOrderService" DECIMAL(12,2) NOT NULL,
    "Message" TEXT,

    CONSTRAINT "OrderCopyServices_pkey" PRIMARY KEY ("OrderID","CopyID","ServiceID")
);

-- CreateTable
CREATE TABLE "Payments" (
    "PayID" TEXT NOT NULL,
    "OrderID" TEXT NOT NULL,
    "Method" TEXT NOT NULL,
    "PaymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "Amount" DECIMAL(12,2) NOT NULL,
    "ConfirmedAt" TIMESTAMP(3),

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("PayID")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "DeliveryID" TEXT NOT NULL,
    "OrderID" TEXT NOT NULL,
    "RecipientName" TEXT NOT NULL,
    "RecipientPhone" TEXT NOT NULL,
    "RecipientAddress" TEXT NOT NULL,
    "DeliveryNote" TEXT,
    "ShippingFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "TrackingCode" TEXT,
    "ShippingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "HandedOverAt" TIMESTAMP(3),
    "DeliveredAt" TIMESTAMP(3),

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("DeliveryID")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "StatusID" TEXT NOT NULL,
    "OrderID" TEXT NOT NULL,
    "Timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Status" TEXT NOT NULL,
    "Note" TEXT,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("StatusID")
);

-- CreateTable
CREATE TABLE "CartBookCopies" (
    "UserID" TEXT NOT NULL,
    "CopyID" TEXT NOT NULL,

    CONSTRAINT "CartBookCopies_pkey" PRIMARY KEY ("UserID","CopyID")
);

-- CreateTable
CREATE TABLE "Reviews" (
    "ReviewsID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "BookID" TEXT NOT NULL,
    "Rating" INTEGER NOT NULL,
    "Comment" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("ReviewsID")
);

-- CreateTable
CREATE TABLE "BlogPosts" (
    "PostID" TEXT NOT NULL,
    "BookID" TEXT,
    "UserID" TEXT NOT NULL,
    "ParentID" TEXT,
    "Content" TEXT NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPosts_pkey" PRIMARY KEY ("PostID")
);

-- CreateTable
CREATE TABLE "ImagesBlogPosts" (
    "PostID" TEXT NOT NULL,
    "ImageUrl" TEXT NOT NULL,

    CONSTRAINT "ImagesBlogPosts_pkey" PRIMARY KEY ("PostID","ImageUrl")
);

-- CreateTable
CREATE TABLE "Likes" (
    "UserID" TEXT NOT NULL,
    "PostID" TEXT NOT NULL,

    CONSTRAINT "Likes_pkey" PRIMARY KEY ("UserID","PostID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_Username_key" ON "Users"("Username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_Email_key" ON "Users"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_Phone_key" ON "Users"("Phone");

-- CreateIndex
CREATE UNIQUE INDEX "Categories_Name_key" ON "Categories"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "Authors_Name_key" ON "Authors"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "Publishers_Name_key" ON "Publishers"("Name");

-- CreateIndex
CREATE INDEX "Books_Title_idx" ON "Books"("Title");

-- CreateIndex
CREATE INDEX "BookCopies_Price_idx" ON "BookCopies"("Price");

-- CreateIndex
CREATE INDEX "BookCopies_ConditionPercent_idx" ON "BookCopies"("ConditionPercent");

-- CreateIndex
CREATE UNIQUE INDEX "Orders_OrderCode_key" ON "Orders"("OrderCode");

-- CreateIndex
CREATE UNIQUE INDEX "Payments_OrderID_key" ON "Payments"("OrderID");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_OrderID_key" ON "Delivery"("OrderID");

-- AddForeignKey
ALTER TABLE "AddressesCustomer" ADD CONSTRAINT "AddressesCustomer_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Books" ADD CONSTRAINT "Books_PublisherID_fkey" FOREIGN KEY ("PublisherID") REFERENCES "Publishers"("PublisherID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookAuthors" ADD CONSTRAINT "BookAuthors_BookID_fkey" FOREIGN KEY ("BookID") REFERENCES "Books"("BookID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookAuthors" ADD CONSTRAINT "BookAuthors_AuthorID_fkey" FOREIGN KEY ("AuthorID") REFERENCES "Authors"("AuthorID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookCategories" ADD CONSTRAINT "BookCategories_BookID_fkey" FOREIGN KEY ("BookID") REFERENCES "Books"("BookID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookCategories" ADD CONSTRAINT "BookCategories_CategoryID_fkey" FOREIGN KEY ("CategoryID") REFERENCES "Categories"("CategoryID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookCopies" ADD CONSTRAINT "BookCopies_BookID_fkey" FOREIGN KEY ("BookID") REFERENCES "Books"("BookID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagesBookCopies" ADD CONSTRAINT "ImagesBookCopies_CopyID_fkey" FOREIGN KEY ("CopyID") REFERENCES "BookCopies"("CopyID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderBookCopies" ADD CONSTRAINT "OrderBookCopies_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "Orders"("OrderID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderBookCopies" ADD CONSTRAINT "OrderBookCopies_CopyID_fkey" FOREIGN KEY ("CopyID") REFERENCES "BookCopies"("CopyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCopyServices" ADD CONSTRAINT "OrderCopyServices_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "Orders"("OrderID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCopyServices" ADD CONSTRAINT "OrderCopyServices_CopyID_fkey" FOREIGN KEY ("CopyID") REFERENCES "BookCopies"("CopyID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCopyServices" ADD CONSTRAINT "OrderCopyServices_ServiceID_fkey" FOREIGN KEY ("ServiceID") REFERENCES "Services"("ServiceID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "Orders"("OrderID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "Orders"("OrderID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "Orders"("OrderID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartBookCopies" ADD CONSTRAINT "CartBookCopies_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartBookCopies" ADD CONSTRAINT "CartBookCopies_CopyID_fkey" FOREIGN KEY ("CopyID") REFERENCES "BookCopies"("CopyID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_BookID_fkey" FOREIGN KEY ("BookID") REFERENCES "Books"("BookID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPosts" ADD CONSTRAINT "BlogPosts_BookID_fkey" FOREIGN KEY ("BookID") REFERENCES "Books"("BookID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPosts" ADD CONSTRAINT "BlogPosts_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPosts" ADD CONSTRAINT "BlogPosts_ParentID_fkey" FOREIGN KEY ("ParentID") REFERENCES "BlogPosts"("PostID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagesBlogPosts" ADD CONSTRAINT "ImagesBlogPosts_PostID_fkey" FOREIGN KEY ("PostID") REFERENCES "BlogPosts"("PostID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Likes" ADD CONSTRAINT "Likes_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Likes" ADD CONSTRAINT "Likes_PostID_fkey" FOREIGN KEY ("PostID") REFERENCES "BlogPosts"("PostID") ON DELETE CASCADE ON UPDATE CASCADE;
